import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import Sidebar from "../../components/Sidebar/Sidebar";
import TestHeader from "../../components/Header/Header";
import TestCards from "../../components/TestCards/TestCards";
import type { Project, TestCase } from "../../types";
import ProjectService from "../../services/ProjectService";
import TestService from "../../services/TestService";
import ExecutionService from "../../services/ExecutionService";
import { invoke } from "@tauri-apps/api/core";


const Tests = () => {
  const { projectId } = useParams<{ projectId: string }>();
  const navigate = useNavigate();
  const [currentProject, setCurrentProject] = useState<Project | null>(null);
  const [tests, setTests] = useState<TestCase[]>([]);
  const [isGenerating, setIsGenerating] = useState(false);
  const [isRunning, setIsRunning] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [hasGeneratedTests, setHasGeneratedTests] = useState(false);

  useEffect(() => {
    const loadProjectAndTests = async () => {
      if (projectId) {
        setIsLoading(true);
        try {
          const project = await ProjectService.getProjectById(projectId);
          if (project) {
            setCurrentProject(project);
            await ProjectService.updateLastOpened(projectId);

            const existingTests = await TestService.getTestsByProjectId(projectId);
            setTests(existingTests);
            setHasGeneratedTests(existingTests.length > 0);

            // Backend salva os dados automaticamente, não precisa carregar fullTests aqui
          } else {
            navigate("/");
          }
        } catch (error) {
          navigate("/");
        } finally {
          setIsLoading(false);
        }
      }
    };

    loadProjectAndTests();
  }, [projectId, navigate]);

  const handleGenerateTests = async () => {
    if (!projectId || !currentProject) {
      return;
    }

    setIsGenerating(true);

    try {
      // Backend gera e salva ambos os arquivos automaticamente
      await invoke('generate_tests', {
        projectId: projectId
      });

      // Recarrega os TestCase do backend
      const testCases = await TestService.getTestsByProjectId(projectId);
      setTests(testCases);
      setHasGeneratedTests(true);
    } catch (error) {
      console.error('Erro ao gerar testes:', error);
      // TODO: Adicionar toast/notificação de erro
    } finally {
      setIsGenerating(false);
    }
  };

  const handleRunTests = async () => {
    if (!projectId || !currentProject) return;

    setIsRunning(true);

    try {
      setTests(tests.map(test => ({ ...test, status: "running" as const, executionTime: 0 })));

      // Backend carrega FullTestFromAI automaticamente
      const executionResponse = await invoke<TestCase[]>('execute_tests', {
        projectId: projectId
      });

      await TestService.saveTestResults(projectId, {
        projectId,
        executionId: crypto.randomUUID(),
        testResults: executionResponse,
        executedAt: new Date().toISOString(),
        totalExecutionTime: executionResponse.reduce((acc, test) => acc + (test.executionTime || 0), 0)
      });

      await ExecutionService.saveExecution(
        projectId,
        currentProject.name,
        executionResponse
      );

      setTests(executionResponse);
    } catch (error) {
      console.error('Erro ao executar testes:', error);
      setTests(tests.map(test => ({ ...test, status: "failed" as const })));
    } finally {
      setIsRunning(false);
    }
  };

  
  const displayTests = isGenerating || isRunning ? [] : tests;

  if (isLoading) {
    return (
      <div className="flex h-screen bg-zinc-900 items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4"></div>
          <h3 className="text-lg font-medium text-white">Loading Project...</h3>
          <p className="text-gray-300">Setting up your workspace</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-screen bg-zinc-900">
      <Sidebar
        currentProject={currentProject}
      />

      <div className="flex-1 flex flex-col">
        {isGenerating && (
          <div className="flex-1 flex items-center justify-center">
            <div className="text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4"></div>
              <h3 className="text-lg font-medium text-white">Generating Tests...</h3>
              <p className="text-gray-300">AI is analyzing your code and creating test cases</p>
            </div>
          </div>
        )}

        {isRunning && (
          <div className="flex-1 flex items-center justify-center">
            <div className="text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-500 mx-auto mb-4"></div>
              <h3 className="text-lg font-medium text-white">Running Tests...</h3>
              <p className="text-gray-300">Executing tests and comparing outputs</p>
            </div>
          </div>
        )}

        {!isGenerating && !isRunning && (
          <>
            <div className="p-6 border-b border-zinc-800">
              <TestHeader
                title={"Tests"}
                subtitle={"Generate and Run Tests"}
                actionButton={
                  hasGeneratedTests ? (
                    <button
                      onClick={handleRunTests}
                      className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-lg font-medium transition-colors flex items-center gap-2"
                    >
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" />
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                      Run Tests
                    </button>
                  ) : (
                    <button
                      onClick={handleGenerateTests}
                      className="bg-green-600 hover:bg-green-700 text-white px-6 py-2 rounded-lg font-medium transition-colors flex items-center gap-2"
                    >
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                      </svg>
                      Generate Tests
                    </button>
                  )
                }
              />
            </div>
            <div className="flex-1 overflow-auto p-6">
              <TestCards
                tests={displayTests}
                projectId={projectId}
              />
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default Tests;