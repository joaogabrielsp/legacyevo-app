import { Execution, ExecutionResult, ExecutionHistory, TestCase } from '../types';
import { readTextFile, writeTextFile, exists, create, remove } from '@tauri-apps/plugin-fs';
import { appDataDir, join } from '@tauri-apps/api/path';

class ExecutionService {
  private async getExecutionsFilePath(projectId: string): Promise<string> {
    const appDir = await appDataDir();
    return await join(appDir, `executions-${projectId}.json`);
  }

  private async ensureAppDataDir(): Promise<void> {
    try {
      const appDir = await appDataDir();
      const dirExists = await exists(appDir);
      if (!dirExists) {
        await create(appDir);
      }
    } catch (error) {
      throw error;
    }
  }

  async saveExecution(projectId: string, projectName: string, testResults: TestCase[]): Promise<Execution> {
    try {
      await this.ensureAppDataDir();

      const passedTests = testResults.filter(test => test.status === 'passed').length;
      const failedTests = testResults.filter(test => test.status === 'failed').length;
      const totalExecutionTime = testResults.reduce((total, test) => total + (test.executionTime || 0), 0);

      const execution: Execution = {
        id: crypto.randomUUID(),
        projectId,
        projectName,
        executedAt: new Date().toISOString(),
        totalTests: testResults.length,
        passedTests,
        failedTests,
        totalExecutionTime,
        status: failedTests === 0 ? 'passed' : 'failed'
      };

      const executionsFilePath = await this.getExecutionsFilePath(projectId);
      let history: ExecutionHistory = { projectId, executions: [] };

      const fileExists = await exists(executionsFilePath);
      if (fileExists) {
        const content = await readTextFile(executionsFilePath);
        if (content && content.trim().length > 0) {
          history = JSON.parse(content);
        }
      }

      history.executions.unshift(execution);

      if (history.executions.length > 50) {
        history.executions = history.executions.slice(0, 50);
      }

      await writeTextFile(executionsFilePath, JSON.stringify(history, null, 2));

      return execution;
    } catch (error) {
      throw error;
    }
  }

  async getExecutionsByProject(projectId: string): Promise<Execution[]> {
    try {
      await this.ensureAppDataDir();
      const executionsFilePath = await this.getExecutionsFilePath(projectId);
      const fileExists = await exists(executionsFilePath);

      if (!fileExists) {
        return [];
      }

      const content = await readTextFile(executionsFilePath);

      if (!content || content.trim().length === 0) {
        return [];
      }

      const history: ExecutionHistory = JSON.parse(content);
      return history.executions;
    } catch (error) {
      return [];
    }
  }

  async getExecutionById(projectId: string, executionId: string): Promise<Execution | null> {
    try {
      const executions = await this.getExecutionsByProject(projectId);
      const execution = executions.find(exec => exec.id === executionId);
      return execution || null;
    } catch (error) {
      return null;
    }
  }

  async getExecutionResult(projectId: string, executionId: string): Promise<ExecutionResult | null> {
    try {
      const execution = await this.getExecutionById(projectId, executionId);
      if (!execution) {
        return null;
      }

      const TestService = (await import('./TestService')).default;
      const testResults = await TestService.getTestsByProjectId(projectId);

      const executionResult: ExecutionResult = {
        ...execution,
        testResults
      };

      return executionResult;
    } catch (error) {
      return null;
    }
  }

  async deleteAllExecutionsFromProject(projectId: string): Promise<void> {
    try {
      await this.ensureAppDataDir();
      const executionsFilePath = await this.getExecutionsFilePath(projectId);

      if (await exists(executionsFilePath)) {
        await remove(executionsFilePath);
      }
    } catch (error) {
      throw error;
    }
  }
}

export default new ExecutionService();