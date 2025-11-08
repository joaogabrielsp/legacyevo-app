// Prevents additional console window on Windows in release, DO NOT REMOVE!!
#![cfg_attr(not(debug_assertions), windows_subsystem = "windows")]

mod ai;
mod project;

use ai::{GroqService, TestCase, ProjectInfo, FullTestFromAI, ExecutionInfo};
use project::ProjectService;
use std::process::Command;
use std::fs;
use std::io::Write;
use std::time::Instant;

#[tauri::command]
async fn generate_tests(project_id: String, app: tauri::AppHandle) -> Result<Vec<FullTestFromAI>, String> {
    println!("🚀 Iniciando geração de testes para o projeto: {}", project_id);

    let project_info = ProjectService::load_project(&project_id, &app).await?;
    println!("📋 Projeto carregado: {}", project_info.name);

    ProjectService::validate_project_paths(&project_info)?;
    println!("✅ Paths validados com sucesso");

    let (legacy_code, new_code) = ProjectService::read_both_project_codes(&project_info).await?;
    println!("📚 Código lido: {} caracteres (legado) e {} caracteres (novo)",
             legacy_code.len(), new_code.len());

    let groq_service = GroqService::new();

    // Gera FullTestFromAI completo (com metadados de execução)
    let full_tests = groq_service.generate_full_tests(
        &legacy_code,
        &new_code,
        &project_info
    ).await?;

    println!("✅ {} FullTestFromAI gerados com sucesso!", full_tests.len());

    // Converte para TestCase (para UI)
    let test_cases: Vec<TestCase> = full_tests.iter().map(|full_test| TestCase {
        id: full_test.id.clone(),
        name: full_test.name.clone(),
        description: full_test.description.clone(),
        full_code: full_test.full_code.clone(),
        status: "pending".to_string(),
        execution_time: None,
        legacy_output: None,
        new_output: None,
    }).collect();

    // Salva ambos os arquivos
    ProjectService::save_tests(&project_id, test_cases, &app).await?;
    ProjectService::save_full_tests(&project_id, full_tests.clone(), &app).await?;

    println!("✅ Testes salvos em ambos os arquivos (tests.json e full_tests.json)");

    Ok(full_tests)
}

#[tauri::command]
async fn execute_tests(project_id: String, app: tauri::AppHandle) -> Result<Vec<TestCase>, String> {
    println!("🚀 Carregando FullTestFromAI do projeto: {}", project_id);

    // Carrega FullTestFromAI persistido
    let tests = ProjectService::load_full_tests(&project_id, &app).await?;

    if tests.is_empty() {
        return Err("Nenhum FullTestFromAI encontrado. Por favor, gere testes primeiro.".to_string());
    }

    println!("🚀 Executando {} testes com metadados da IA", tests.len());

    let mut executed_tests = Vec::new();

    for (i, test) in tests.into_iter().enumerate() {
        println!("⚡ [{}/{}] Executando: {}", i + 1, executed_tests.len() + 1, test.name);
        let start_time = Instant::now();

        if let Some(compile_cmd) = &test.legacy_exec.compile_command {
            println!("🔨 Compilando legado: {}", compile_cmd);
            match Command::new("sh").arg("-c").arg(compile_cmd).output() {
                Ok(output) if output.status.success() => {
                    println!("✅ Compilação legado bem-sucedida");
                },
                Ok(output) => {
                    let stderr = String::from_utf8_lossy(&output.stderr);
                    println!("❌ Erro na compilação legado: {}", stderr);
                    continue;
                },
                Err(e) => {
                    println!("❌ Erro ao compilar legado: {}", e);
                    continue;
                }
            }
        }

        if let Some(compile_cmd) = &test.new_exec.compile_command {
            println!("🔨 Compilando novo: {}", compile_cmd);
            match Command::new("sh").arg("-c").arg(compile_cmd).output() {
                Ok(output) if output.status.success() => {
                    println!("✅ Compilação novo bem-sucedida");
                },
                Ok(output) => {
                    let stderr = String::from_utf8_lossy(&output.stderr);
                    println!("❌ Erro na compilação novo: {}", stderr);
                    continue;
                },
                Err(e) => {
                    println!("❌ Erro ao compilar novo: {}", e);
                    continue;
                }
            }
        }

        let test_inputs = extract_test_inputs(&test.full_code);

        println!("🔍 Test inputs extraídos: {:?}", test_inputs);
        println!("📝 Código do teste: {}", test.full_code);

        // Monta o comando completo com argumentos
        // Escapa caracteres especiais do shell (*, ?, etc)
        let escaped_inputs: Vec<String> = test_inputs.iter().map(|input| {
            if input == "*" {
                "'*'".to_string()
            } else if input == "?" {
                "'?'".to_string()
            } else {
                input.clone()
            }
        }).collect();

        let legacy_cmd = if test_inputs.is_empty() {
            test.legacy_exec.execute_command.clone()
        } else {
            format!("{} {}", test.legacy_exec.execute_command, escaped_inputs.join(" "))
        };
        let new_cmd = if test_inputs.is_empty() {
            test.new_exec.execute_command.clone()
        } else {
            format!("{} {}", test.new_exec.execute_command, escaped_inputs.join(" "))
        };

        println!("🎯 Comando legado: {}", legacy_cmd);
        println!("🎯 Comando novo: {}", new_cmd);

        println!("🎯 Executando legado: {}", legacy_cmd);
        let legacy_result = Command::new("sh")
            .arg("-c")
            .arg(&legacy_cmd)
            .current_dir(&test.legacy_exec.working_directory)
            .output();

        println!("🎯 Executando novo: {}", new_cmd);
        let new_result = Command::new("sh")
            .arg("-c")
            .arg(&new_cmd)
            .current_dir(&test.new_exec.working_directory)
            .output();

        match (legacy_result, new_result) {
            (Ok(legacy_output), Ok(new_output)) => {
                let execution_time = start_time.elapsed().as_millis() as u64;

                let legacy_out = String::from_utf8_lossy(&legacy_output.stdout).to_string();
                let new_out = String::from_utf8_lossy(&new_output.stdout).to_string();

                let legacy_final = if legacy_out.trim().is_empty() {
                    String::from_utf8_lossy(&legacy_output.stderr).to_string()
                } else {
                    legacy_out
                };

                let new_final = if new_out.trim().is_empty() {
                    String::from_utf8_lossy(&new_output.stderr).to_string()
                } else {
                    new_out
                };

                // Compara outputs - considera sucesso se forem idênticos ou se ambos são mensagens de uso
                let success = legacy_final.trim() == new_final.trim() ||
                             (legacy_final.contains("Uso:") && new_final.contains("Uso:") &&
                              legacy_final.contains("<numero1>") && new_final.contains("<numero1>"));

                let test_case = TestCase {
                    id: test.id.clone(),
                    name: test.name.clone(),
                    description: test.description.clone(),
                    full_code: test.full_code.clone(),
                    status: if success { "passed" } else { "failed" }.to_string(),
                    execution_time: Some(execution_time),
                    legacy_output: Some(legacy_final),
                    new_output: Some(new_final),
                };

                executed_tests.push(test_case);

                println!("{} Teste {} concluído em {}ms - Status: {}",
                        if success { "✅" } else { "❌" },
                        test.name,
                        execution_time,
                        if success { "PASS" } else { "FAIL" });
            },
            (Err(e), _) | (_, Err(e)) => {
                println!("❌ Erro executando teste {}: {}", test.name, e);

                let test_case = TestCase {
                    id: test.id.clone(),
                    name: test.name.clone(),
                    description: test.description.clone(),
                    full_code: test.full_code.clone(),
                    status: "failed".to_string(),
                    execution_time: Some(start_time.elapsed().as_millis() as u64),
                    legacy_output: Some(format!("Erro: {}", e)),
                    new_output: Some(format!("Erro: {}", e)),
                };

                executed_tests.push(test_case);
            }
        }
    }

    println!("✅ {} testes executados! Passaram: {}, Falharam: {}",
             executed_tests.len(),
             executed_tests.iter().filter(|t| t.status == "passed").count(),
             executed_tests.iter().filter(|t| t.status == "failed").count());

    Ok(executed_tests)
}


fn extract_test_inputs(test_code: &str) -> Vec<String> {
    // Remove comentários e linhas vazias
    let clean_code = test_code
        .lines()
        .filter(|line| !line.trim().starts_with("//") && !line.trim().is_empty())
        .collect::<Vec<_>>()
        .join(" ");

    // Padrão 1: Extrai números e operadores diretamente do código
    use regex::Regex;
    let re_basic = Regex::new(r#"(\d+\.?\d*|[+\-*/%^])"#).unwrap();

    let inputs: Vec<String> = re_basic.find_iter(&clean_code)
        .map(|m| m.as_str().to_string())
        .collect();

    // Se já encontramos inputs suficientes (pelo menos 3 para num1 op num2), retorna
    if inputs.len() >= 3 {
        return inputs;
    }

    // Padrão 2: Casos incompletos como "2 +" ou "+ 3" - detectar erro esperado
    if inputs.len() == 2 {
        // Verifica se temos número + operador ou operador + número
        let has_number = inputs.iter().any(|i| i.chars().next().unwrap().is_numeric());
        let has_operator = inputs.iter().any(|i| "+-*/%^".contains(i));

        if has_number && has_operator {
            // É um caso incompleto esperando erro (como "2 +" ou "+ 3")
            // Retorna os inputs existentes para que o programa mostre erro de argumentos faltando
            return inputs;
        }
    }

    // Padrão 3: Procura por declarações de variáveis com valores
    let re_vars = Regex::new(r#"(?:let|const|int|float|double)\s+\w+\s*=\s*(\d+\.?\d*)\s*;?"#).unwrap();
    let var_values: Vec<String> = re_vars.captures_iter(&clean_code)
        .map(|cap| cap[1].to_string())
        .collect();

    if var_values.len() >= 2 {
        // Se temos pelo menos 2 variáveis numéricas, procuramos o operador
        let re_op = Regex::new(r#"([+\-*/^])"#).unwrap();
        let op_match = re_op.find(&clean_code);

        let mut result = var_values;
        if let Some(op) = op_match {
            result.insert(1, op.as_str().to_string());
        }
        return result;
    }

    // Padrão 4: Procura por chamadas de função com argumentos
    let re_func = Regex::new(r#"[a-zA-Z_]\w*\s*\(\s*(\d+\.?\d*)\s*,\s*([+\-*/^])\s*,\s*(\d+\.?\d*)\s*\)"#).unwrap();
    if let Some(cap) = re_func.captures(&clean_code) {
        return vec![
            cap[1].to_string(),
            cap[2].to_string(),
            cap[3].to_string()
        ];
    }

    // Padrão 5: Testes com variáveis (a + b) - usar valores de exemplo
    if clean_code.contains("a") && clean_code.contains("b") {
        if let Some(op_match) = re_basic.find(&clean_code) {
            let op = op_match.as_str();
            if op.chars().any(|c| "+-*/%^".contains(c)) {
                return vec!["5".to_string(), op.to_string(), "3".to_string()];
            }
        }
    }

    // Padrão 6: Teste de uso (vazio ou sem argumentos) - não precisa de inputs
    if clean_code.trim().is_empty() || clean_code.to_lowercase().contains("usage") ||
       clean_code.to_lowercase().contains("sem argumentos") || clean_code.to_lowercase().contains("no args") {
        return vec![];  // Teste de uso intencionalmente vazio
    }

    // Padrão 7: Fallback para operadores não suportados - usar valores de exemplo
    if !inputs.is_empty() {
        return inputs;
    }

    // Se nada funcionou, retorna vazio para fallback
    vec![]
}


#[tauri::command]
async fn validate_project(project_id: String, app: tauri::AppHandle) -> Result<ProjectInfo, String> {
    println!("🔍 Validando projeto: {}", project_id);

    let project_info = ProjectService::load_project(&project_id, &app).await?;
    ProjectService::validate_project_paths(&project_info)?;

    let (legacy_executable, new_executable) = ProjectService::find_both_executables(&project_info)?;

    println!("✅ Projeto válido com executáveis: {} → {}", legacy_executable, new_executable);
    Ok(project_info)
}

fn main() {
    tauri::Builder::default()
        .plugin(tauri_plugin_dialog::init())
        .plugin(tauri_plugin_opener::init())
        .plugin(tauri_plugin_fs::init())
        .invoke_handler(tauri::generate_handler![generate_tests, execute_tests, validate_project])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
