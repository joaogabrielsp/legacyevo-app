import { TestCase, TestExecutionResponse } from '../types';
import { readTextFile, writeTextFile, exists, create, remove } from '@tauri-apps/plugin-fs';
import { appDataDir, join } from '@tauri-apps/api/path';

class TestService {
  private async getTestsFilePath(projectId: string): Promise<string> {
    const appDir = await appDataDir();
    return await join(appDir, `tests-${projectId}.json`);
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

  async saveGeneratedTests(projectId: string, tests: TestCase[]): Promise<void> {
    try {
      await this.ensureAppDataDir();

      const testsFilePath = await this.getTestsFilePath(projectId);
      let existingTests: Record<string, TestCase> = {};

      const fileExists = await exists(testsFilePath);
      if (fileExists) {
        const content = await readTextFile(testsFilePath);
        if (content && content.trim().length > 0) {
          existingTests = JSON.parse(content);
        }
      }

      tests.forEach(test => {
        existingTests[test.id] = {
          ...test,
          status: 'pending'
        };
      });

      await writeTextFile(testsFilePath, JSON.stringify(existingTests, null, 2));

    } catch (error) {
      throw error;
    }
  }

  async getTestsByProjectId(projectId: string): Promise<TestCase[]> {
    return await this.getTestsByProject(projectId);
  }

  async getTestsByProject(projectId: string): Promise<TestCase[]> {
    try {
      await this.ensureAppDataDir();
      const testsFilePath = await this.getTestsFilePath(projectId);
      const fileExists = await exists(testsFilePath);

      if (!fileExists) {
        return [];
      }

      const content = await readTextFile(testsFilePath);

      if (!content || content.trim().length === 0) {
        return [];
      }

      const tests: Record<string, TestCase> = JSON.parse(content);
      return Object.values(tests);
    } catch (error) {
      return [];
    }
  }

  async getTestById(projectId: string, testId: string): Promise<TestCase | null> {
    try {
      const tests = await this.getTestsByProject(projectId);
      const test = tests.find(test => test.id === testId);
      return test || null;
    } catch (error) {
      return null;
    }
  }

  
  async updateTestResult(projectId: string, testId: string, result: {
    status: TestCase['status'];
    executionTime?: number;
    legacyOutput?: string;
    newOutput?: string;
  }): Promise<void> {
    try {
      await this.ensureAppDataDir();
      const testsFilePath = await this.getTestsFilePath(projectId);
      let tests: Record<string, TestCase> = {};

      const fileExists = await exists(testsFilePath);
      if (fileExists) {
        const content = await readTextFile(testsFilePath);
        tests = JSON.parse(content);
      }

      if (tests[testId]) {
        tests[testId] = {
          ...tests[testId],
          ...result
        };

        await writeTextFile(testsFilePath, JSON.stringify(tests, null, 2));
      } else {
        console.warn(`⚠️ Test ${testId} not found for updating`);
      }
    } catch (error) {
      throw error;
    }
  }

  async saveTestResult(projectId: string, test: TestCase): Promise<void> {
    try {
      await this.updateTestResult(projectId, test.id, {
        status: test.status,
        executionTime: test.executionTime,
        legacyOutput: test.legacyOutput,
        newOutput: test.newOutput
      });
    } catch (error) {
      throw error;
    }
  }

  async saveTestResults(projectId: string, executionResponse: TestExecutionResponse): Promise<void> {
    try {
      for (const test of executionResponse.testResults) {
        await this.updateTestResult(projectId, test.id, {
          status: test.status,
          executionTime: test.executionTime,
          legacyOutput: test.legacyOutput,
          newOutput: test.newOutput
        });
      }
    } catch (error) {
      throw error;
    }
  }

  
  async deleteTest(projectId: string, testId: string): Promise<void> {
    try {
      await this.ensureAppDataDir();

      const testsFilePath = await this.getTestsFilePath(projectId);
      let tests: Record<string, TestCase> = {};

      const fileExists = await exists(testsFilePath);
      if (fileExists) {
        const content = await readTextFile(testsFilePath);
        tests = JSON.parse(content);
        delete tests[testId];
        await writeTextFile(testsFilePath, JSON.stringify(tests, null, 2));
      }
    } catch (error) {
      throw error;
    }
  }

  async deleteAllTestsFromProject(projectId: string): Promise<void> {
    try {
      await this.ensureAppDataDir();

      const testsFilePath = await this.getTestsFilePath(projectId);

      if (await exists(testsFilePath)) {
        await remove(testsFilePath);
      }
    } catch (error) {
      throw error;
    }
  }
}

export default new TestService();