import React, { useState, useEffect } from 'react';
import { Execution } from '../../types';
import ExecutionService from '../../services/ExecutionService';

interface ExecutionHistoryProps {
  projectId: string;
}

const ExecutionHistory: React.FC<ExecutionHistoryProps> = ({
  projectId
}) => {
  const [executions, setExecutions] = useState<Execution[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadExecutions();
  }, [projectId]);

  const loadExecutions = async () => {
    try {
      setLoading(true);
      const executionList = await ExecutionService.getExecutionsByProject(projectId);
      setExecutions(executionList);
      setError(null);
    } catch (err) {
      setError('Failed to load execution history');
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (isoString: string) => {
    const date = new Date(isoString);
    const now = new Date();
    const diffInHours = (now.getTime() - date.getTime()) / (1000 * 60 * 60);

    if (diffInHours < 1) {
      const diffInMinutes = Math.floor((now.getTime() - date.getTime()) / (1000 * 60));
      return `${diffInMinutes} ${diffInMinutes === 1 ? 'minute' : 'minutes'} ago`;
    } else if (diffInHours < 24) {
      return `${Math.floor(diffInHours)} hours ago`;
    } else {
      return date.toLocaleDateString('pt-BR', {
        day: '2-digit',
        month: '2-digit',
        year: date.getFullYear() !== now.getFullYear() ? 'numeric' : undefined,
        hour: '2-digit',
        minute: '2-digit'
      });
    }
  };

  if (loading) {
    return (
      <div className="w-full max-w-4xl mb-8">
        <h2 className="text-2xl font-semibold mb-4">Executions</h2>
        <div className="flex justify-center items-center py-8">
          <div className="text-gray-400">Loading executions...</div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="w-full max-w-4xl mb-8">
        <h2 className="text-2xl font-semibold mb-4">Executions</h2>
        <div className="flex justify-center items-center py-8">
          <div className="text-red-400">{error}</div>
        </div>
      </div>
    );
  }

  if (executions.length === 0) {
    return (
      <div className="w-full max-w-5xl mb-8 mx-auto mt-20">
        <div className="text-white text-center">
          <svg className="w-16 h-16 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M13 10V3L4 14h7v7l9-11h-7z" />
          </svg>
          <h3 className="text-2xl font-medium mb-2 text-white">No executions yet</h3>
          <p className="text-gray-300 text-lg">Run some tests to see execution history here</p>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full max-w-5xl mb-8">
      <h2 className="text-2xl font-semibold mb-4 text-white">{executions.length} executions</h2>
      <div className="space-y-3">
        {executions.map((execution) => (
          <div
            key={execution.id}
            className="bg-zinc-800 border border-zinc-700 rounded-lg w-full"
          >
            <div className="p-5">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4 flex-1">
                  {/* Status Icon */}
                  <div className={execution.status === 'passed' ? 'text-green-400' : 'text-red-400'}>
                    {execution.status === 'passed' ? (
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                    ) : (
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    )}
                  </div>

                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <h3 className="text-lg font-mono font-medium text-white">
                        {execution.id.slice(0, 8)}
                      </h3>
                    </div>

                    <div className="flex items-center gap-4 text-sm text-gray-400">
                      <span>{execution.totalTests} tests</span>
                      <span className="text-green-400">{execution.passedTests} passed</span>
                      {execution.failedTests > 0 && (
                        <span className="text-red-400">{execution.failedTests} failed</span>
                      )}
                    </div>
                  </div>

                </div>
                <div className="text-right text-sm text-gray-400">
                  <div className="font-medium text-gray-300">
                    {formatDate(execution.executedAt)}
                  </div>
                  <div className="text-xs mt-1">
                    {execution.totalExecutionTime < 1000
                      ? `${execution.totalExecutionTime}ms`
                      : `${(execution.totalExecutionTime / 1000).toFixed(1)}s`
                    }
                  </div>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default ExecutionHistory;