use reqwest::Client;
use serde_json::{json, Value};

/// Serviço para integração com Groq AI
pub struct GroqService {
    client: Client,
    model: String,
}

impl GroqService {
    pub fn new() -> Self {
        dotenv::dotenv().ok();

        Self {
            client: Client::new(),
            model: "llama-3.3-70b-versatile".to_string(),
        }
    }

    /// Gera testes de compatibilidade usando Groq AI
    pub async fn generate_tests(
        &self,
        legacy_code: &str,
        new_code: &str,
        project_info: &ProjectInfo
    ) -> Result<Vec<TestCase>, String> {
        let full_tests = self.generate_full_tests(legacy_code, new_code, project_info).await?;

        let test_cases: Vec<TestCase> = full_tests.into_iter().map(|full_test| {
            TestCase {
                id: full_test.id.clone(),
                name: full_test.name.clone(),
                description: full_test.description.clone(),
                full_code: full_test.full_code.clone(),
                status: "pending".to_string(),
                execution_time: None,
                legacy_output: None,
                new_output: None,
            }
        }).collect();

        Ok(test_cases)
    }

    /// Gera testes completos com metadados de execução usando Groq
    pub async fn generate_full_tests(
        &self,
        legacy_code: &str,
        new_code: &str,
        project_info: &ProjectInfo
    ) -> Result<Vec<FullTestFromAI>, String> {
        let api_key = std::env::var("GROQ_API_KEY")
            .expect("Erro: GROQ_API_KEY não configurada. Configure a variável de ambiente.");

        println!("🤖 Chamando Groq AI para gerar testes...");

        let prompt = self.build_comparison_prompt(legacy_code, new_code, project_info);

        let payload = json!({
            "model": self.model,
            "messages": [
                {
                    "role": "system",
                    "content": "You are an expert software testing assistant. Generate comprehensive tests to validate behavioral compatibility between terminal applications. Always return valid JSON."
                },
                {
                    "role": "user",
                    "content": prompt
                }
            ],
            "max_tokens": 6000,
            "temperature": 0.1,
            "response_format": {"type": "json_object"}
        });

        let response = self
            .client
            .post("https://api.groq.com/openai/v1/chat/completions")
            .header("Authorization", format!("Bearer {}", api_key))
            .header("Content-Type", "application/json")
            .json(&payload)
            .send()
            .await
            .map_err(|e| format!("Erro na requisição Groq: {}", e))?;

        let status = response.status();
        if !status.is_success() {
            let error_text = response.text().await.unwrap_or_default();
            return Err(format!("Groq API error ({}): {}", status, error_text));
        }

        let response_json: Value = response
            .json()
            .await
            .map_err(|e| format!("Erro ao parsear resposta JSON: {}", e))?;

        self.extract_full_tests_from_response(response_json).await
    }

    
    fn build_comparison_prompt(
        &self,
        legacy_code: &str,
        new_code: &str,
        project_info: &ProjectInfo
    ) -> String {
        let os = if cfg!(windows) {
            "Windows"
        } else if cfg!(target_os = "macos") {
            "macOS"
        } else {
            "Linux"
        };

        format!(
            r#"You are a software testing expert specializing in terminal application compatibility testing.

ENVIRONMENT: {} operating system

NOTE: Command syntax varies between operating systems (e.g., 'python3' vs 'python', './program' vs 'program.exe', path separators). Use appropriate commands for the detected OS.

PROJECT DETAILS:
- Name: {}
- Type: Terminal Application
- Legacy Path: {}
- New Path: {}

TASK: Generate comprehensive tests to validate BEHAVIORAL COMPATIBILITY between the legacy and new versions.

LEGACY APPLICATION CODE:
{}

NEW APPLICATION CODE:
{}

REQUIREMENTS:
1. Generate 9 comprehensive test scenarios to ensure thorough validation
2. Each test must execute BOTH versions (legacy and new) with identical inputs
3. Compare outputs (stdout, stderr, exit codes)
4. Validate identical functionality and behavior
5. Test edge cases and error scenarios
6. Return only execution metadata for the Rust system to run the tests

TEST STRUCTURE:
Each test should:
- Define specific test inputs and scenarios
- Provide execution commands for both versions
- Include expected outputs for validation
- Enable the Rust system to run and compare both versions automatically

FOCUS ON:
- Functional equivalence (same inputs → same outputs)
- Data transformation accuracy
- Error handling consistency
- File operations and side effects
- Command-line argument processing

RETURN FORMAT:
Return a JSON object with this structure:
{{
  "tests": [
    {{
      "id": "unique-test-id",
      "name": "Descriptive test name",
      "description": "What this test validates",
      "fullCode": "Test inputs as command-line arguments (e.g., '2 + 3', '--input file.txt', 'username password')",
      "expectedExitCode": 0,
      "timeout": 30000,
      "legacyExec": {{
        "type": "c_compiled|python|node|java|rust|go",
        "sourceFile": "calculadora.c",
        "compileCommand": "gcc -o calculadora calculadora.c -lm",
        "executeCommand": "./calculadora",
        "workingDirectory": "/path/to/legacy/project"
      }},
      "newExec": {{
        "type": "c_compiled|python|node|java|rust|go",
        "sourceFile": "calculadora.py",
        "compileCommand": null,
        "executeCommand": "python3 calculadora.py",
        "workingDirectory": "/path/to/new/project"
      }}
    }}
  ]
}}

EXECUTION TYPES:
- c_compiled: C/C++ needs compilation (include -lm for math functions)
- python: Python scripts run with appropriate Python command for the OS
- node: JavaScript/Node.js run directly
- java: Java needs compilation (javac) then execution (java)
- rust: Rust needs compilation (cargo build or rustc)
- go: Go needs compilation (go build)

IMPORTANT: Analyze the code to determine:
1. What language each project uses
2. If compilation is needed
3. What dependencies/libraries are used (like math.h → add -lm)
4. The exact commands to compile and execute each program

COMPILATION COMMANDS:
- Always use FULL PATHS for source files
- Use 'cd' command to set working directory first, then compile
- Example: "cd /full/path/to/project && gcc -o calculadora calculadora.c -lm"
- Or: "gcc -o /full/path/to/project/calculadora /full/path/to/project/calculadora.c -lm"

EXECUTION COMMANDS:
- Use relative paths when working directory is set
- Example: "./calculadora" (when cd was used)
- Or use full paths: "/full/path/to/project/calculadora"

IMPORTANT: Provide accurate execution commands so the Rust system can compile, run and compare both versions automatically.

INPUT FORMAT REQUIREMENTS:
- Analyze how each application expects command-line arguments
- Generate inputs in the correct order for that specific application
- Examples: "2 + 3" for calculators, "--input file.txt" for file processors, "user123" for authentication systems
- The Rust system will split the fullCode string by spaces to create command arguments
- Ensure the input format matches what the application actually expects"#,
            os,
            project_info.name,
            project_info.legacy_path,
            project_info.new_path,
            legacy_code,
            new_code
        )
    }

    /// Extrai FullTestFromAI da resposta da API (com todos os metadados)
    async fn extract_full_tests_from_response(&self, response: Value) -> Result<Vec<FullTestFromAI>, String> {
        let content = response
            .get("choices")
            .and_then(|choices| choices.get(0))
            .and_then(|choice| choice.get("message"))
            .and_then(|message| message.get("content"))
            .and_then(|content| content.as_str())
            .ok_or("Formato de resposta inválido da Groq API")?;

        println!("📝 Resposta da IA recebida, tamanho: {} caracteres", content.len());
        println!("📄 Primeiros 500 chars:\n{}", &content[..content.len().min(500)]);

        let parsed: Value = serde_json::from_str(content)
            .map_err(|e| format!("Erro ao parsear JSON da IA: {}\nConteúdo: {}", e, &content[..content.len().min(200)]))?;

        let tests_array = parsed
            .get("tests")
            .ok_or("Resposta não contém campo 'tests'")?
            .as_array()
            .ok_or("'tests' não é um array")?;

        let mut full_tests = Vec::new();
        for (i, test_value) in tests_array.iter().enumerate() {
            if let Ok(mut full_test) = serde_json::from_value::<FullTestFromAI>(test_value.clone()) {
                if full_test.id.is_empty() {
                    full_test.id = format!("test-{}", i + 1);
                }
                if full_test.timeout.is_none() {
                    full_test.timeout = Some(30000);
                }

                full_tests.push(full_test);
            } else {
                println!("⚠️ Erro ao parsear teste {}", i);
                return Err(format!("Erro no teste {}: formato inválido", i));
            }
        }

        if full_tests.is_empty() {
            return Err("Nenhum teste válido gerado".to_string());
        }

        println!("✅ {} testes completos gerados com sucesso", full_tests.len());
        Ok(full_tests)
    }
}

use serde::{Deserialize, Serialize};

#[derive(Serialize, Deserialize, Debug, Clone)]
pub struct ProjectInfo {
    pub id: String,
    pub name: String,
    #[serde(rename = "legacyPath")]
    pub legacy_path: String,
    #[serde(rename = "newPath")]
    pub new_path: String,
    #[serde(rename = "type")]
    pub project_type: String,
}

#[derive(Serialize, Deserialize, Debug, Clone)]
pub struct TestCase {
    pub id: String,
    pub name: String,
    pub description: String,
    #[serde(rename = "fullCode")]
    pub full_code: String,
    pub status: String,
    #[serde(rename = "executionTime")]
    pub execution_time: Option<u64>,
    #[serde(rename = "legacyOutput")]
    pub legacy_output: Option<String>,
    #[serde(rename = "newOutput")]
    pub new_output: Option<String>,
}

impl Default for TestCase {
    fn default() -> Self {
        Self {
            id: String::new(),
            name: String::new(),
            description: String::new(),
            full_code: String::new(),
            status: "pending".to_string(),
            execution_time: None,
            legacy_output: None,
            new_output: None,
        }
    }
}

#[derive(Serialize, Deserialize, Debug, Clone)]
pub struct FullTestFromAI {
    pub id: String,
    pub name: String,
    pub description: String,
    #[serde(rename = "fullCode")]
    pub full_code: String,
    #[serde(rename = "expectedExitCode")]
    pub expected_exit_code: i32,
    pub timeout: Option<u64>,

    #[serde(rename = "legacyExec")]
    pub legacy_exec: ExecutionInfo,
    #[serde(rename = "newExec")]
    pub new_exec: ExecutionInfo,
}

/// Informações de como executar cada projeto
#[derive(Serialize, Deserialize, Debug, Clone)]
pub struct ExecutionInfo {
    #[serde(rename = "type")]
    pub exec_type: String,
    #[serde(rename = "sourceFile")]
    pub source_file: String,
    #[serde(rename = "compileCommand")]
    pub compile_command: Option<String>,
    #[serde(rename = "executeCommand")]
    pub execute_command: String,
    #[serde(rename = "workingDirectory")]
    pub working_directory: String,
}

#[derive(Debug, Clone)]
pub struct ExecutableTest {
    pub test_case: TestCase,
    pub command: String,
    pub args: Vec<String>,
    pub working_directory: String,
    pub expected_exit_code: i32,
    pub timeout: u64,
}