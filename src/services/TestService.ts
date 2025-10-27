import { TestCase, TestCode, TestGenerationResponse, TestExecutionResponse } from '../types';
import { readTextFile, writeTextFile, exists, create, remove } from '@tauri-apps/plugin-fs';
import { appDataDir, join } from '@tauri-apps/api/path';

class TestService {
  private async getTestsFilePath(projectId: string): Promise<string> {
    const appDir = await appDataDir();
    return await join(appDir, `tests-${projectId}.json`);
  }

  private async getTestCodesFilePath(projectId: string): Promise<string> {
    const appDir = await appDataDir();
    return await join(appDir, `test-codes-${projectId}.json`);
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

  async saveGeneratedTests(projectId: string, generationResponse: TestGenerationResponse): Promise<void> {
    try {
      await this.ensureAppDataDir();

      const testCodesFilePath = await this.getTestCodesFilePath(projectId);
      const testCodes: Record<string, TestCode> = {};

      generationResponse.generatedTests.forEach(test => {
        testCodes[test.id] = test;
      });

      await writeTextFile(testCodesFilePath, JSON.stringify(testCodes, null, 2));

      const testsFilePath = await this.getTestsFilePath(projectId);
      let existingTests: Record<string, TestCase> = {};

      const fileExists = await exists(testsFilePath);
      if (fileExists) {
        const content = await readTextFile(testsFilePath);
        if (content && content.trim().length > 0) {
          existingTests = JSON.parse(content);
        }
      }

      generationResponse.generatedTests.forEach(test => {
        if (!existingTests[test.id]) {
          existingTests[test.id] = {
            id: test.id,
            name: test.name,
            description: test.description,
            status: 'pending'
          };
        }
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

  async getTestCodeById(projectId: string, testId: string): Promise<TestCode | null> {
    try {
      await this.ensureAppDataDir();
      const testCodesFilePath = await this.getTestCodesFilePath(projectId);
      const fileExists = await exists(testCodesFilePath);

      if (!fileExists) {
        return null;
      }

      const content = await readTextFile(testCodesFilePath);
      const testCodes: Record<string, TestCode> = JSON.parse(content);
      const testCode = testCodes[testId];

      return testCode || null;
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

      const testCodesFilePath = await this.getTestCodesFilePath(projectId);
      let testCodes: Record<string, TestCode> = {};

      const codesFileExists = await exists(testCodesFilePath);
      if (codesFileExists) {
        const content = await readTextFile(testCodesFilePath);
        testCodes = JSON.parse(content);
        delete testCodes[testId];
        await writeTextFile(testCodesFilePath, JSON.stringify(testCodes, null, 2));
      }
    } catch (error) {
      throw error;
    }
  }

  async deleteAllTestsFromProject(projectId: string): Promise<void> {
    try {
      await this.ensureAppDataDir();

      const testsFilePath = await this.getTestsFilePath(projectId);
      const testCodesFilePath = await this.getTestCodesFilePath(projectId);

      if (await exists(testsFilePath)) {
        await remove(testsFilePath);
      }

      if (await exists(testCodesFilePath)) {
        await remove(testCodesFilePath);
      }
    } catch (error) {
      throw error;
    }
  }
}

export default new TestService();