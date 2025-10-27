import { useEffect, useState } from "react";
import { TestCase, TestCode } from "../../types";
import TestService from "../../services/TestService";
import CodeEditor from "../CodeEditor/CodeEditor";

interface TestDetailsProps {
  test: TestCase;
  projectId: string;
}

const TestDetails: React.FC<TestDetailsProps> = ({ test, projectId }) => {
  const [testCode, setTestCode] = useState<TestCode | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const getStatusColor = (status: TestCase["status"]) => {
    switch (status) {
      case "pending":
        return "text-gray-400";
      case "passed":
        return "text-green-400";
      case "failed":
        return "text-red-400";
      default:
        return "text-gray-400";
    }
  };

  useEffect(() => {
    const loadTestCode = async () => {
      try {
        const code = await TestService.getTestCodeById(projectId, test.id);
        setTestCode(code);
      } catch (error) {
      } finally {
        setIsLoading(false);
      }
    };

    loadTestCode();
  }, [projectId, test.id]);

  if (isLoading) {
    return <div className="text-white">Loading test code...</div>;
  }

  return (
    <main className="flex-1 p-6">
      <div className="max-w-4xl mx-auto">
        <div className="flex flex-row justify-between">
          <h1
            className={`text-4xl font-bold mb-4 ${getStatusColor(test.status)}`}
          >
            {test.name}
          </h1>
          <div className={getStatusColor(test.status)}>
            {test.status === "passed" ? (
              <svg
                className="w-8 h-8"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M5 13l4 4L19 7"
                />
              </svg>
            ) : test.status === "failed" ? (
              <svg
                className="w-8 h-8"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M6 18L18 6M6 6l12 12"
                />
              </svg>
            ) : (
              <svg
                className="w-8 h-8"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
            )}
          </div>
        </div>
        <p className="text-lg text-gray-300 mb-8">{test.description}</p>
        <div className="text-sm text-gray-400 mb-4">
          Execution time: {test.executionTime}ms
        </div>

        {testCode && (
          <div className="mt-8">
            <h2 className="text-2xl font-semibold text-white mb-4">Code</h2>
            <CodeEditor
              value={testCode.fullCode}
              language="typescript"
              height={`min(60vh, ${
                400 + testCode.fullCode.split("\n").length * 20
              }px)`}
              readOnly
            />
          </div>
        )}
      </div>
    </main>
  );
};

export default TestDetails;
