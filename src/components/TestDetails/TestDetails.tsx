import { useEffect, useState } from "react";
import { TestCase } from "../../types";
import TestService from "../../services/TestService";
import CodeEditor from "../CodeEditor/CodeEditor";

interface TestDetailsProps {
  test: TestCase;
  projectId: string;
}

const TestDetails: React.FC<TestDetailsProps> = ({ test, projectId }) => {
  const [fullTest, setFullTest] = useState<TestCase | null>(null);
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
    const loadFullTest = async () => {
      try {
        const fullTestData = await TestService.getTestById(projectId, test.id);
        setFullTest(fullTestData);
      } catch (error) {
      } finally {
        setIsLoading(false);
      }
    };

    loadFullTest();
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

        {(test.legacyOutput || test.newOutput) && (
          <div className="mt-8 space-y-6">
            <h2 className="text-2xl font-semibold text-white mb-4">Execution Results</h2>

            {test.legacyOutput && (
              <div className="bg-gray-800 rounded-lg p-4">
                <h3 className="text-lg font-medium text-blue-400 mb-2">Legacy Output</h3>
                <pre className="text-green-400 font-mono text-sm whitespace-pre-wrap">
                  {test.legacyOutput}
                </pre>
              </div>
            )}

            {test.newOutput && (
              <div className="bg-gray-800 rounded-lg p-4">
                <h3 className="text-lg font-medium text-purple-400 mb-2">New Output</h3>
                <pre className="text-green-400 font-mono text-sm whitespace-pre-wrap">
                  {test.newOutput}
                </pre>
              </div>
            )}

            {test.legacyOutput && test.newOutput && (
              <div className="bg-gray-800 rounded-lg p-4">
                <h3 className="text-lg font-medium text-yellow-400 mb-2">Comparison</h3>
                <div className="flex items-center space-x-2">
                  {test.legacyOutput === test.newOutput ? (
                    <>
                      <svg className="w-5 h-5 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                      <span className="text-green-400">Outputs are identical</span>
                    </>
                  ) : (
                    <>
                      <svg className="w-5 h-5 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                      </svg>
                      <span className="text-red-400">Outputs differ</span>
                    </>
                  )}
                </div>
              </div>
            )}
          </div>
        )}

        {fullTest?.fullCode && (
          <div className="mt-8">
            <h2 className="text-2xl font-semibold text-white mb-4">Test Details</h2>
            <div className="bg-gray-800 rounded-lg p-4">
              <h3 className="text-lg font-medium text-cyan-400 mb-2">Test Input/Configuration</h3>
              <CodeEditor
                value={fullTest.fullCode}
                language="text"
                height={`min(40vh, ${
                  200 + fullTest.fullCode.split("\n").length * 20
                }px)`}
                readOnly
              />
            </div>
          </div>
        )}
      </div>
    </main>
  );
};

export default TestDetails;
