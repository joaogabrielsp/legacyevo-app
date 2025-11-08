export interface TestCase {
  id: string
  name: string
  description: string
  fullCode?: string  // Código do teste gerado pela IA
  status: "pending" | "running" | "passed" | "failed"
  legacyOutput?: string
  newOutput?: string
  executionTime?: number
}

// 🆕 Tipo completo recebido do backend Rust com metadados de execução
export interface FullTestFromAI {
  id: string
  name: string
  description: string
  fullCode: string
  expectedExitCode: number
  timeout?: number

  // 🆕 Execução específica para cada projeto
  legacyExec: ExecutionInfo
  newExec: ExecutionInfo
}

// Informações de como executar cada projeto
export interface ExecutionInfo {
  type: string                    // "c_compiled", "python", "node", etc.
  sourceFile: string              // "calculadora.c", "calculadora.py"
  compileCommand?: string         // "gcc -o calculadora calculadora.c -lm"
  executeCommand: string          // "./calculadora", "python calculadora.py"
  workingDirectory: string        // Caminho completo para o diretório do projeto
}

// Execução de Testes (Runtime)
export interface TestExecutionResponse {
  projectId: string
  executionId: string
  testResults: TestCase[]
  executedAt: string
  totalExecutionTime: number
}


export interface Project{
    id: string
    name: string
    type: ProjectType
    legacyPath?: string
    newPath?: string
    lastOpened?: Date
}

export interface NewProjectData {
  name: string;
  legacyPath: string;
  newPath: string;
  type: ProjectType;
}


export type ProjectType = 'API' | 'Web' | 'Terminal';

export interface Execution {
  id: string
  projectId: string
  projectName: string
  executedAt: string
  totalTests: number
  passedTests: number
  failedTests: number
  totalExecutionTime: number
  status: 'passed' | 'failed'
}

export interface ExecutionResult extends Execution {
  testResults: TestCase[]
}

export interface ExecutionHistory {
  projectId: string
  executions: Execution[]
}