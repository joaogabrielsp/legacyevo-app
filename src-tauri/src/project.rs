use crate::ai::{ProjectInfo, TestCase, FullTestFromAI};
use std::fs;
use std::path::Path;
use std::process::Command;
use serde_json;
use tauri::Manager;

/// Serviço para gerenciar projetos e ler código
pub struct ProjectService;

impl ProjectService {
    /// Carrega informações do projeto salvo pelo frontend
    pub async fn load_project(project_id: &str, app: &tauri::AppHandle) -> Result<ProjectInfo, String> {
        let app_dir = app.path().app_data_dir()
            .map_err(|e| format!("Não foi possível obter diretório de dados: {}", e))?;

        let projects_file = app_dir.join("projects.json");

        println!("📂 Lendo arquivo de projetos: {:?}", projects_file);

        if !projects_file.exists() {
            return Err(format!("Arquivo de projetos não encontrado: {:?}", projects_file));
        }

        let content = fs::read_to_string(&projects_file)
            .map_err(|e| format!("Erro ao ler arquivo de projetos: {}", e))?;

        let projects: Vec<ProjectInfo> = serde_json::from_str(&content)
            .map_err(|e| format!("Erro ao parsear JSON dos projetos: {}", e))?;

        let project = projects.into_iter()
            .find(|p| p.id == project_id)
            .ok_or(format!("Projeto com ID '{}' não encontrado", project_id))?;

        if !Path::new(&project.legacy_path).exists() {
            return Err(format!("Path legado não existe: {}", project.legacy_path));
        }

        if !Path::new(&project.new_path).exists() {
            return Err(format!("Path novo não existe: {}", project.new_path));
        }

        println!("✅ Projeto carregado: {} ({} -> {})",
            project.name, project.legacy_path, project.new_path);

        Ok(project)
    }

    /// Lê todo o código-fonte de um diretório
    pub async fn read_project_code(project_path: &str) -> Result<String, String> {
        println!("📚 Analisando código em: {}", project_path);

        // Extensões de arquivo que vamos ler
        let code_extensions = vec!["py", "js", "ts", "sh", "bash", "rb", "php", "java", "cpp", "c", "rs"];

        let mut all_code = String::new();
        let mut file_count = 0;

        // Lê todos os arquivos recursivamente
        for entry in walkdir::WalkDir::new(project_path)
            .into_iter()
            .filter_map(|e| e.ok())
            .filter(|e| e.file_type().is_file()) {

            let path = entry.path();

            // Verifica extensão
            if let Some(extension) = path.extension() {
                if let Some(ext_str) = extension.to_str() {
                    if code_extensions.contains(&ext_str) {
                        match fs::read_to_string(path) {
                            Ok(content) => {
                                // Adiciona header com info do arquivo
                                all_code.push_str(&format!(
                                    "\n// === ARQUIVO: {} ===\n",
                                    path.display()
                                ));
                                all_code.push_str(&content);
                                all_code.push('\n');
                                file_count += 1;
                            },
                            Err(e) => {
                                println!("⚠️ Erro lendo arquivo {}: {}", path.display(), e);
                            }
                        }
                    }
                }
            }
        }

        if all_code.is_empty() {
            return Err(format!("Nenhum arquivo de código encontrado em: {}", project_path));
        }

        println!("✅ Lidos {} arquivos de código", file_count);

        Ok(all_code)
    }

    /// Lê código de ambos os projetos (legado e novo)
    pub async fn read_both_project_codes(project: &ProjectInfo) -> Result<(String, String), String> {
        println!("📖 Lendo código dos dois projetos...");

        let legacy_code = Self::read_project_code(&project.legacy_path).await?;
        let new_code = Self::read_project_code(&project.new_path).await?;

        println!("✅ Código legado: {} caracteres", legacy_code.len());
        println!("✅ Código novo: {} caracteres", new_code.len());

        Ok((legacy_code, new_code))
    }

    /// Valida se os diretórios do projeto são válidos
    pub fn validate_project_paths(project: &ProjectInfo) -> Result<(), String> {
        // Valida se paths existem
        if !Path::new(&project.legacy_path).exists() {
            return Err(format!("Diretório legado não encontrado: {}", project.legacy_path));
        }

        if !Path::new(&project.new_path).exists() {
            return Err(format!("Diretório novo não encontrado: {}", project.new_path));
        }

        // Valida se são diretórios (não arquivos)
        if !Path::new(&project.legacy_path).is_dir() {
            return Err(format!("Path legado não é um diretório: {}", project.legacy_path));
        }

        if !Path::new(&project.new_path).is_dir() {
            return Err(format!("Path novo não é um diretório: {}", project.new_path));
        }

        println!("✅ Paths do projeto validados com sucesso");
        Ok(())
    }

    /// Identifica o arquivo executável principal usando heurísticas
    pub fn find_main_executable(project_path: &str) -> Result<String, String> {
        println!("🔍 Procurando executável principal em: {}", project_path);

        // Extensões que consideramos para projetos de terminal
        let code_extensions = vec!["py", "js", "ts", "sh", "bash", "rb", "php", "java", "cpp", "c", "rs"];

        // Nomes de arquivo comuns (ordem de prioridade)
        let priority_names = vec![
            "main", "app", "index", "start", "run", "cli", "server", "client",
            "entry", "init", "bootstrap", "program", "application"
        ];

        let mut candidates = Vec::new();

        // Lê todos os arquivos recursivamente
        for entry in walkdir::WalkDir::new(project_path)
            .into_iter()
            .filter_map(|e| e.ok())
            .filter(|e| e.file_type().is_file()) {

            let path = entry.path();

            // Verifica extensão
            if let Some(extension) = path.extension() {
                if let Some(ext_str) = extension.to_str() {
                    if code_extensions.contains(&ext_str) {
                        let file_name = path.file_name()
                            .and_then(|n| n.to_str())
                            .unwrap_or("");

                        let score = Self::calculate_executable_score(file_name, &priority_names);
                        candidates.push((score, path.to_path_buf(), file_name.to_string()));

                        // Se encontrou arquivo com nome exato de alta prioridade, retorna imediatamente
                        if score >= 90 {
                            println!("✅ Executável principal encontrado (alta prioridade): {}", path.display());
                            return Ok(path.to_string_lossy().to_string());
                        }
                    }
                }
            }
        }

        // Ordena por score (maior primeiro)
        candidates.sort_by(|a, b| b.0.cmp(&a.0));

        if candidates.is_empty() {
            return Err(format!("Nenhum arquivo de código encontrado em: {}", project_path));
        }

        // Retorna o candidato com maior score
        let best_candidate = &candidates[0];
        println!("✅ Executável principal selecionado: {} (score: {})",
                best_candidate.1.display(), best_candidate.0);

        Ok(best_candidate.1.to_string_lossy().to_string())
    }

    /// Calcula score para arquivo executável baseado em heurísticas
    fn calculate_executable_score(file_name: &str, priority_names: &[&str]) -> i32 {
        let mut score = 0;

        // Converte para minúsculas para comparação
        let name_lower = file_name.to_lowercase();

        // Remove extensão para análise do nome base
        let name_without_ext = if let Some(dot_pos) = name_lower.rfind('.') {
            &name_lower[..dot_pos]
        } else {
            &name_lower
        };

        // Verifica se o nome é exatamente um dos prioritários
        for (i, priority_name) in priority_names.iter().enumerate() {
            if name_without_ext == *priority_name {
                // Maior score para nomes no início da lista
                score += 100 - (i * 5);
                break;
            }
        }

        // Bônus se contém palavras-chave de executáveis
        if name_lower.contains("main") || name_lower.contains("start") || name_lower.contains("run") {
            score += 50;
        }
        if name_lower.contains("app") || name_lower.contains("cli") || name_lower.contains("server") {
            score += 40;
        }
        if name_lower.contains("index") || name_lower.contains("entry") || name_lower.contains("init") {
            score += 30;
        }

        // Bônus por estar em diretório raiz (provavelmente o ponto de entrada)
        if !file_name.contains('/') && !file_name.contains('\\') {
            score += 20;
        }

        // Penalidade por ser arquivo de configuração ou testes
        if name_lower.contains("config") || name_lower.contains("test") ||
           name_lower.contains("spec") || name_lower.starts_with('.') {
            score -= 30;
        }

        // Bônus por extensões de linguagens comuns para CLI
        if name_lower.ends_with(".py") { score += 10; }
        if name_lower.ends_with(".js") || name_lower.ends_with(".ts") { score += 8; }
        if name_lower.ends_with(".sh") || name_lower.ends_with(".bash") { score += 15; }
        if name_lower.ends_with(".rs") { score += 12; }
        if name_lower.ends_with(".go") { score += 12; }

        score.max(0) as i32
    }

    /// Verifica se arquivo tem shebang (indicando que é executável)
    pub fn has_shebang(file_path: &Path) -> bool {
        match fs::read_to_string(file_path) {
            Ok(content) => {
                let first_line = content.lines().next().unwrap_or("");
                first_line.starts_with("#!")
            },
            Err(_) => false
        }
    }

    /// Identifica os executáveis principais para ambos os projetos
    pub fn find_both_executables(project: &ProjectInfo) -> Result<(String, String), String> {
        println!("🎯 Procurando executáveis nos dois projetos...");

        let legacy_executable = Self::find_main_executable(&project.legacy_path)?;
        let new_executable = Self::find_main_executable(&project.new_path)?;

        println!("✅ Executáveis encontrados:");
        println!("   Legado: {}", legacy_executable);
        println!("   Novo: {}", new_executable);

        Ok((legacy_executable, new_executable))
    }

    /// Compila um programa se necessário e retorna o caminho do executável
    pub fn ensure_executable(source_path: &str) -> Result<String, String> {
        let path = Path::new(source_path);

        if !path.exists() {
            return Err(format!("Arquivo não encontrado: {}", source_path));
        }

        // Se já for executável, retorna o próprio caminho
        if Self::is_executable(source_path) {
            println!("✅ Arquivo já é executável: {}", source_path);
            return Ok(source_path.to_string());
        }

        // Identifica a linguagem pela extensão
        let extension = path.extension()
            .and_then(|ext| ext.to_str())
            .unwrap_or("");

        match extension {
            "c" => Self::compile_c(source_path),
            "cpp" | "cc" | "cxx" => Self::compile_cpp(source_path),
            "py" => {
                println!("✅ Python não precisa de compilação: {}", source_path);
                Ok(source_path.to_string())
            },
            "js" | "ts" => {
                println!("✅ JavaScript/TypeScript não precisa de compilação para execução: {}", source_path);
                Ok(source_path.to_string())
            },
            "rs" => Self::compile_rust(source_path),
            "go" => Self::compile_go(source_path),
            "java" => Self::compile_java(source_path),
            _ => {
                println!("⚠️ Extensão '{}' desconhecida, tentando executar diretamente: {}", extension, source_path);
                Ok(source_path.to_string())
            }
        }
    }

    /// Verifica se um arquivo já é executável
    fn is_executable(file_path: &str) -> bool {
        #[cfg(unix)]
        {
            use std::os::unix::fs::PermissionsExt;
            let metadata = fs::metadata(file_path);
            if let Ok(meta) = metadata {
                meta.permissions().mode() & 0o111 != 0
            } else {
                false
            }
        }
        #[cfg(not(unix))]
        {
            // No Windows, verificamos pela extensão .exe
            file_path.to_lowercase().ends_with(".exe")
        }
    }

    /// Compila arquivo C usando gcc
    fn compile_c(source_path: &str) -> Result<String, String> {
        let path = Path::new(source_path);
        let source_dir = path.parent().unwrap_or_else(|| Path::new("."));
        let source_name = path.file_stem()
            .and_then(|name| name.to_str())
            .ok_or("Nome do arquivo inválido")?;

        let executable_path = source_dir.join(source_name);

        println!("🔨 Compilando arquivo C: {} -> {}", source_path, executable_path.display());

        let output = Command::new("gcc")
            .arg("-o")
            .arg(&executable_path)
            .arg(source_path)
            .output()
            .map_err(|e| format!("Erro ao executar gcc: {}", e))?;

        if output.status.success() {
            println!("✅ Compilação C bem-sucedida: {}", executable_path.display());
            Ok(executable_path.to_string_lossy().to_string())
        } else {
            let stderr = String::from_utf8_lossy(&output.stderr);
            Err(format!("Erro na compilação C: {}", stderr))
        }
    }

    /// Compila arquivo C++ usando g++
    fn compile_cpp(source_path: &str) -> Result<String, String> {
        let path = Path::new(source_path);
        let source_dir = path.parent().unwrap_or_else(|| Path::new("."));
        let source_name = path.file_stem()
            .and_then(|name| name.to_str())
            .ok_or("Nome do arquivo inválido")?;

        let executable_path = source_dir.join(source_name);

        println!("🔨 Compilando arquivo C++: {} -> {}", source_path, executable_path.display());

        let output = Command::new("g++")
            .arg("-o")
            .arg(&executable_path)
            .arg(source_path)
            .output()
            .map_err(|e| format!("Erro ao executar g++: {}", e))?;

        if output.status.success() {
            println!("✅ Compilação C++ bem-sucedida: {}", executable_path.display());
            Ok(executable_path.to_string_lossy().to_string())
        } else {
            let stderr = String::from_utf8_lossy(&output.stderr);
            Err(format!("Erro na compilação C++: {}", stderr))
        }
    }

    /// Compila arquivo Rust usando cargo ou rustc
    fn compile_rust(source_path: &str) -> Result<String, String> {
        let path = Path::new(source_path);

        // Se houver Cargo.toml no diretório, usa cargo build
        let source_dir = path.parent().unwrap_or_else(|| Path::new("."));
        let cargo_toml = source_dir.join("Cargo.toml");

        if cargo_toml.exists() {
            println!("🦀 Compilando projeto Rust com cargo em: {}", source_dir.display());

            let output = Command::new("cargo")
                .args(&["build", "--release"])
                .current_dir(source_dir)
                .output()
                .map_err(|e| format!("Erro ao executar cargo: {}", e))?;

            if output.status.success() {
                let executable_path = source_dir.join("target").join("release").join(
                    source_dir.file_name().unwrap_or_else(|| std::ffi::OsStr::new("program"))
                );
                println!("✅ Compilação Rust com cargo bem-sucedida: {}", executable_path.display());
                Ok(executable_path.to_string_lossy().to_string())
            } else {
                let stderr = String::from_utf8_lossy(&output.stderr);
                Err(format!("Erro na compilação Rust com cargo: {}", stderr))
            }
        } else {
            // Compila arquivo único com rustc
            let source_name = path.file_stem()
                .and_then(|name| name.to_str())
                .ok_or("Nome do arquivo inválido")?;

            let executable_path = source_dir.join(source_name);

            println!("🦀 Compilando arquivo Rust único: {} -> {}", source_path, executable_path.display());

            let output = Command::new("rustc")
                .arg("-o")
                .arg(&executable_path)
                .arg(source_path)
                .output()
                .map_err(|e| format!("Erro ao executar rustc: {}", e))?;

            if output.status.success() {
                println!("✅ Compilação Rust bem-sucedida: {}", executable_path.display());
                Ok(executable_path.to_string_lossy().to_string())
            } else {
                let stderr = String::from_utf8_lossy(&output.stderr);
                Err(format!("Erro na compilação Rust: {}", stderr))
            }
        }
    }

    /// Compila arquivo Go
    fn compile_go(source_path: &str) -> Result<String, String> {
        let path = Path::new(source_path);
        let source_dir = path.parent().unwrap_or_else(|| Path::new("."));
        let source_name = path.file_stem()
            .and_then(|name| name.to_str())
            .ok_or("Nome do arquivo inválido")?;

        let executable_path = source_dir.join(source_name);

        println!("🐹 Compilando arquivo Go: {} -> {}", source_path, executable_path.display());

        let output = Command::new("go")
            .arg("build")
            .arg("-o")
            .arg(&executable_path)
            .arg(source_path)
            .output()
            .map_err(|e| format!("Erro ao executar go build: {}", e))?;

        if output.status.success() {
            println!("✅ Compilação Go bem-sucedida: {}", executable_path.display());
            Ok(executable_path.to_string_lossy().to_string())
        } else {
            let stderr = String::from_utf8_lossy(&output.stderr);
            Err(format!("Erro na compilação Go: {}", stderr))
        }
    }

    /// Compila arquivo Java
    fn compile_java(source_path: &str) -> Result<String, String> {
        let path = Path::new(source_path);
        let source_dir = path.parent().unwrap_or_else(|| Path::new("."));

        println!("☕ Compilando arquivo Java: {}", source_path);

        let output = Command::new("javac")
            .arg(source_path)
            .current_dir(source_dir)
            .output()
            .map_err(|e| format!("Erro ao executar javac: {}", e))?;

        if output.status.success() {
            println!("✅ Compilação Java bem-sucedida: {}", source_path);
            // Para Java, retornamos o comando para executar a classe
            let class_name = path.file_stem()
                .and_then(|name| name.to_str())
                .ok_or("Nome do arquivo inválido")?;
            Ok(format!("java {}", class_name))
        } else {
            let stderr = String::from_utf8_lossy(&output.stderr);
            Err(format!("Erro na compilação Java: {}", stderr))
        }
    }

    /// Garante que ambos os programas estejam compilados e prontos para execução
    pub fn ensure_both_executables(project: &ProjectInfo) -> Result<(String, String), String> {
        println!("🔨 Verificando/Compilando ambos os programas...");

        let (legacy_source, new_source) = Self::find_both_executables(project)?;
        let legacy_executable = Self::ensure_executable(&legacy_source)?;
        let new_executable = Self::ensure_executable(&new_source)?;

        println!("✅ Programas prontos para execução:");
        println!("   Legado: {}", legacy_executable);
        println!("   Novo: {}", new_executable);

        Ok((legacy_executable, new_executable))
    }

    /// Salva TestCase básicos para UI
    pub async fn save_tests(project_id: &str, tests: Vec<TestCase>, app: &tauri::AppHandle) -> Result<(), String> {
        let app_data_dir = app.path().app_data_dir()
            .map_err(|e| format!("Failed to get app data directory: {}", e))?;

        let tests_path = app_data_dir.join(format!("tests-{}.json", project_id));

        // Converte para objeto com ID como chave (formato que o TestService espera)
        let mut tests_map = std::collections::HashMap::new();
        for test in tests {
            tests_map.insert(test.id.clone(), test);
        }

        let json_data = serde_json::to_string_pretty(&tests_map)
            .map_err(|e| format!("Failed to serialize tests: {}", e))?;

        fs::write(tests_path, json_data)
            .map_err(|e| format!("Failed to write tests file: {}", e))?;

        println!("✅ {} TestCase salvos para o projeto {}", tests_map.len(), project_id);
        Ok(())
    }

    /// Carrega TestCase básicos para UI
    pub async fn load_tests(project_id: &str, app: &tauri::AppHandle) -> Result<Vec<TestCase>, String> {
        let app_data_dir = app.path().app_data_dir()
            .map_err(|e| format!("Failed to get app data directory: {}", e))?;

        let tests_path = app_data_dir.join("projects").join(project_id).join("tests.json");

        if !tests_path.exists() {
            return Ok(Vec::new());
        }

        let json_data = fs::read_to_string(tests_path)
            .map_err(|e| format!("Failed to read tests file: {}", e))?;

        let tests: Vec<TestCase> = serde_json::from_str(&json_data)
            .map_err(|e| format!("Failed to deserialize tests: {}", e))?;

        Ok(tests)
    }

    /// Salva FullTestFromAI completo para execução
    pub async fn save_full_tests(project_id: &str, full_tests: Vec<FullTestFromAI>, app: &tauri::AppHandle) -> Result<(), String> {
        let app_data_dir = app.path().app_data_dir()
            .map_err(|e| format!("Failed to get app data directory: {}", e))?;

        let project_dir = app_data_dir.join("projects").join(project_id);
        fs::create_dir_all(&project_dir)
            .map_err(|e| format!("Failed to create project directory: {}", e))?;

        let full_tests_path = project_dir.join("full_tests.json");
        let json_data = serde_json::to_string_pretty(&full_tests)
            .map_err(|e| format!("Failed to serialize full tests: {}", e))?;

        fs::write(full_tests_path, json_data)
            .map_err(|e| format!("Failed to write full tests file: {}", e))?;

        println!("✅ {} FullTestFromAI salvos para o projeto {}", full_tests.len(), project_id);
        Ok(())
    }

    /// Carrega FullTestFromAI completo para execução
    pub async fn load_full_tests(project_id: &str, app: &tauri::AppHandle) -> Result<Vec<FullTestFromAI>, String> {
        let app_data_dir = app.path().app_data_dir()
            .map_err(|e| format!("Failed to get app data directory: {}", e))?;

        let full_tests_path = app_data_dir.join("projects").join(project_id).join("full_tests.json");

        if !full_tests_path.exists() {
            return Ok(Vec::new());
        }

        let json_data = fs::read_to_string(full_tests_path)
            .map_err(|e| format!("Failed to read full tests file: {}", e))?;

        let full_tests: Vec<FullTestFromAI> = serde_json::from_str(&json_data)
            .map_err(|e| format!("Failed to deserialize full tests: {}", e))?;

        Ok(full_tests)
    }
}