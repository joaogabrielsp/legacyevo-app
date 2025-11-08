use serde::{Deserialize, Serialize};

/// Informações do projeto (compatível com frontend)
#[derive(Serialize, Deserialize, Debug, Clone)]
pub struct ProjectInfo {
    pub id: String,
    pub name: String,
    pub legacy_path: String,
    pub new_path: String,
    #[serde(rename = "type")]
    pub project_type: String,
}

/// Caso de teste para comparação legado vs novo
#[derive(Serialize, Deserialize, Debug, Clone)]
pub struct TestCase {
    pub id: String,
    pub name: String,
    pub description: String,
    #[serde(rename = "fullCode")]
    pub full_code: String,
    pub command: String,           // "python", "bash", "node", etc.
    pub args: Vec<String>,        // ["test_file.py"]
    #[serde(rename = "workingDirectory")]
    pub working_directory: String, // path do projeto
    #[serde(rename = "expectedExitCode")]
    pub expected_exit_code: i32,
    pub timeout: Option<u64>,     // em ms
    pub status: TestStatus,
    #[serde(rename = "executionTime")]
    pub execution_time: Option<u64>,
    #[serde(rename = "legacyOutput")]
    pub legacy_output: Option<String>,
    #[serde(rename = "newOutput")]
    pub new_output: Option<String>,
    #[serde(rename = "comparisonResult")]
    pub comparison_result: Option<ComparisonResult>,
}

/// Status do teste
#[derive(Serialize, Deserialize, Debug, Clone)]
#[serde(rename_all = "lowercase")]
pub enum TestStatus {
    Pending,
    Running,
    Passed,
    Failed,
}

/// Resultado da comparação entre legado e novo
#[derive(Serialize, Deserialize, Debug, Clone)]
pub struct ComparisonResult {
    #[serde(rename = "outputsMatch")]
    pub outputs_match: bool,
    #[serde(rename = "exitCodesMatch")]
    pub exit_codes_match: bool,
    #[serde(rename = "performanceDiff")]
    pub performance_diff: Option<f64>,
    pub differences: Vec<String>,
}

/// Resposta da API de IA com testes gerados
#[derive(Serialize, Deserialize, Debug)]
pub struct AITestResponse {
    pub tests: Vec<TestCase>,
}

/// Configuração para chamada à API de IA
#[derive(Debug)]
pub struct AIConfig {
    pub api_key: String,
    pub model: String,
    pub max_tokens: u32,
    pub temperature: f32,
}

impl Default for AIConfig {
    fn default() -> Self {
        Self {
            api_key: String::new(),
            model: "gpt-4".to_string(),
            max_tokens: 4000,
            temperature: 0.1,
        }
    }
}