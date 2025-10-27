import { TestGenerationResponse, TestExecutionResponse, TestCode, TestCase } from '../types';

class MockAPIService {

  async generateTests(projectId: string, projectType: string): Promise<TestGenerationResponse> {
    const delay = Math.random() * 1000 + 1000;
    await new Promise(resolve => setTimeout(resolve, delay));

    const numTests = 6;

    const generatedTests: TestCode[] = [];

    for (let i = 1; i <= numTests; i++) {
      const test = this.generateMockTest(i, projectType);
      generatedTests.push(test);
    }

    const response: TestGenerationResponse = {
      projectId,
      generatedTests
    };

    return response;
  }

  private generateMockTest(index: number, projectType: string): TestCode {
    const testTemplates = this.getTestTemplates(projectType);
    const template = testTemplates[index % testTemplates.length];

    return {
      id: `test-${Date.now()}-${index}`,
      name: template.name,
      description: template.description,
      fullCode: template.fullCode
    };
  }

  private getTestTemplates(projectType: string) {
    const commonTests = [
      {
        name: 'Login Authentication Test',
        description: 'Test user login functionality',
        fullCode: `describe('Login Authentication', () => {
  it('should login with valid credentials', async () => {
    const response = await request(app)
      .post('/login')
      .send({ email: 'user@test.com', password: 'password123' })
      .expect(200);

    expect(response.body.token).toBeDefined();
  });

  it('should reject invalid credentials', async () => {
    await request(app)
      .post('/login')
      .send({ email: 'user@test.com', password: 'wrong' })
      .expect(401);
  });
});`
      },
      {
        name: 'User Registration Test',
        description: 'Test user registration flow',
        fullCode: `describe('User Registration', () => {
  it('should create new user', async () => {
    const userData = {
      name: 'Test User',
      email: 'test@example.com',
      password: 'password123'
    };

    const response = await request(app)
      .post('/register')
      .send(userData)
      .expect(201);

    expect(response.body.user.email).toBe(userData.email);
  });

  it('should validate required fields', async () => {
    await request(app)
      .post('/register')
      .send({ email: '' })
      .expect(400);
  });
});`
      },
      {
        name: 'Data Validation Test',
        description: 'Test input validation',
        fullCode: `describe('Data Validation', () => {
  it('should validate email format', () => {
    expect(validateEmail('user@test.com')).toBe(true);
    expect(validateEmail('invalid-email')).toBe(false);
  });

  it('should validate password strength', () => {
    expect(validatePassword('123456')).toBe(false);
    expect(validatePassword('StrongPass123!')).toBe(true);
  });
});`
      }
    ];

    const apiTests = [
      {
        name: 'API Response Test',
        description: 'Test API response structure',
        fullCode: `describe('API Response', () => {
  it('should return correct data format', async () => {
    const response = await request(app)
      .get('/api/products')
      .expect(200);

    expect(response.body.data).toBeDefined();
    expect(Array.isArray(response.body.data)).toBe(true);
  });
});`
      },
      {
        name: 'CRUD Operations Test',
        description: 'Test create, read, update operations',
        fullCode: `describe('CRUD Operations', () => {
  let itemId: string;

  it('should create new item', async () => {
    const response = await request(app)
      .post('/api/items')
      .send({ name: 'Test Item' })
      .expect(201);

    itemId = response.body.id;
    expect(response.body.name).toBe('Test Item');
  });

  it('should get item by id', async () => {
    const response = await request(app)
      .get(\`/api/items/\${itemId}\`)
      .expect(200);

    expect(response.body.name).toBe('Test Item');
  });
});`
      }
    ];

    const webTests = [
      {
        name: 'Button Click Test',
        description: 'Test button interactions',
        fullCode: `describe('Button Interactions', () => {
  beforeEach(() => {
    document.body.innerHTML = '<button id="test-btn">Click me</button>';
  });

  it('should handle button click', () => {
    const button = document.getElementById('test-btn');
    let clicked = false;

    button?.addEventListener('click', () => {
      clicked = true;
    });

    button?.click();
    expect(clicked).toBe(true);
  });
});`
      },
      {
        name: 'Form Submit Test',
        description: 'Test form submission',
        fullCode: `describe('Form Submission', () => {
  beforeEach(() => {
    document.body.innerHTML = \`
      <form id="test-form">
        <input name="email" required />
        <button type="submit">Submit</button>
      </form>
    \`;
  });

  it('should validate form fields', () => {
    const form = document.getElementById('test-form') as HTMLFormElement;
    const input = form.querySelector('input[name="email"]') as HTMLInputElement;

    input.value = '';
    expect(input.checkValidity()).toBe(false);

    input.value = 'test@example.com';
    expect(input.checkValidity()).toBe(true);
  });
});`
      }
    ];

    switch (projectType) {
      case 'API':
        return [...commonTests, ...apiTests];
      case 'Web':
        return [...commonTests, ...webTests];
      default:
        return commonTests;
    }
  }

  async executeTests(projectId: string): Promise<TestExecutionResponse> {
    const delay = Math.random() * 1000 + 2000;
    const startTime = Date.now();
    await new Promise(resolve => setTimeout(resolve, delay));

    const TestService = (await import('./TestService')).default;
    const realTests = await TestService.getTestsByProjectId(projectId);

    const testResults: TestCase[] = realTests.map(test => {
      const statuses: TestCase['status'][] = ['passed', 'failed', 'passed', 'passed'];
      const randomStatus = statuses[Math.floor(Math.random() * statuses.length)];

      return {
        id: test.id,
        name: test.name,
        description: test.description,
        status: randomStatus,
        executionTime: Math.floor(Math.random() * 500) + 100,
        legacyOutput: JSON.stringify({
          result: randomStatus === 'passed' ? 'success' : 'error',
          timestamp: Date.now(),
          test: test.name
        }),
        newOutput: JSON.stringify({
          result: randomStatus === 'passed' ? 'success' : 'error',
          timestamp: Date.now(),
          test: test.name,
          improved: true
        })
      };
    });

    const totalExecutionTime = Date.now() - startTime;

    const response: TestExecutionResponse = {
      projectId,
      executionId: crypto.randomUUID(),
      testResults,
      executedAt: new Date().toISOString(),
      totalExecutionTime
    };

    return response;
  }

  async executeSingleTest(testId: string, projectId?: string): Promise<TestCase> {
    const delay = Math.random() * 1000 + 1500;
    await new Promise(resolve => setTimeout(resolve, delay));

    const TestService = (await import('./TestService')).default;
    const realTest = await TestService.getTestById(projectId || 'mock', testId);

    const statuses: TestCase['status'][] = ['passed', 'failed'];
    const randomStatus = statuses[Math.floor(Math.random() * statuses.length)];

    const testResult: TestCase = {
      id: testId,
      name: realTest?.name || `Test ${testId}`,
      description: realTest?.description || `Execution result for test ${testId}`,
      status: randomStatus,
      executionTime: Math.floor(Math.random() * 500) + 100,
      legacyOutput: JSON.stringify({
        result: randomStatus === 'passed' ? 'success' : 'error',
        timestamp: Date.now(),
        test: realTest?.name || testId
      }),
      newOutput: JSON.stringify({
        result: randomStatus === 'passed' ? 'success' : 'error',
        timestamp: Date.now(),
        test: realTest?.name || testId,
        improved: true
      })
    };

    return testResult;
  }
}

export default new MockAPIService();