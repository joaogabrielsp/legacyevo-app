import React from "react";
import { useNavigate } from "react-router-dom";
import type { TestCase } from "../../types";

interface TestCardsProps {
  tests: TestCase[];
  projectId?: string;
}

const TestCards: React.FC<TestCardsProps> = ({
  tests,
  projectId,
}) => {
  const navigate = useNavigate();

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

  const getCardBorderColor = (status: TestCase["status"]) => {
    switch (status) {
      case "pending":
        return "border-gray-600";
      case "running":
        return "border-blue-500";
      case "passed":
        return "border-green-500";
      case "failed":
        return "border-red-500";
      default:
        return "border-gray-600";
    }
  };

  if (tests.length === 0) {
    return (
      <div className="w-full max-w-5xl mb-8 mx-auto mt-20">
        <div className="text-center text-white">
          <svg className="w-16 h-16 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
          </svg>
          <h3 className="text-2xl font-medium mb-2 text-white">No tests available</h3>
          <p className="text-lg">
            Generate tests first to see results
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
      {tests.map((test) => (
        <div
          key={test.id}
          className={`bg-zinc-800 rounded-lg border-2 p-4 hover:bg-zinc-750 transition-all cursor-pointer hover:scale-[1.02] active:scale-[0.98] ${getCardBorderColor(test.status)}`}
          onClick={() => {
            if (projectId) {
              navigate(`/details/${projectId}/${test.id}`);
            }
          }}
        >
          <div className="flex items-start justify-between mb-3">
            <h3 className="font-bold text-white flex-1">{test.name}</h3>
              <div className={getStatusColor(test.status)}>
                    {test.status === 'passed' ? (
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                    ) : test.status === 'failed' ? (
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    ) : (
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                    )}
              </div>
            
          </div>

          <p className="text-sm text-gray-300 mb-4">{test.description}</p>

          {/* onRunSingleTest && (
            <div className="flex justify-center mt-4">
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onRunSingleTest(test.id);
                }}
                className="w-10 h-10 bg-gray-600 hover:bg-gray-500 text-white rounded-full transition-all duration-200 flex items-center justify-center hover:scale-105 active:scale-95 shadow-lg hover:shadow-xl"
                title="Run test"
              >
                <svg className="w-4 h-4 ml-0.5" fill="currentColor" viewBox="0 0 20 20">
                  <path d="M6.3 2.841A1.5 1.5 0 004 4.11V15.89a1.5 1.5 0 002.3 1.269l9.344-5.89a1.5 1.5 0 000-2.538L6.3 2.84z" />
                </svg>
              </button>
            </div>
          ) */}
        </div>
      ))}
    </div>
  );
};

export default TestCards;