export interface TestCase {
  id: string
  name: string
  description: string
  status: "pending" | "running" | "passed" | "failed"
  legacyOutput?: string
  newOutput?: string
  executionTime?: number
}

export interface TestCode {
  id: string
  name: string
  description: string
  fullCode: string
}

// Geração de Testes (IA)
export interface TestGenerationResponse {
  projectId: string
  generatedTests: TestCode[]
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

export type TestScreen = "test-list" | "test-results"

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