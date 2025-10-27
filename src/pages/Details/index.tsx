import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import Sidebar from "../../components/Sidebar/Sidebar";
import TestHeader from "../../components/Header/Header";
import { Project, TestCase } from "../../types";
import ProjectService from "../../services/ProjectService";
import TestService from "../../services/TestService";
import TestDetails from "../../components/TestDetails/TestDetails";

const Details = () => {
  const { projectId, testId } = useParams<{
    projectId: string;
    testId: string;
  }>();
  const navigate = useNavigate();
  const [currentTest, setCurrentTest] = useState<TestCase | null>(null);
  const [currentProject, setCurrentProject] = useState<Project | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const loadProjectAndTest = async () => {
      if (projectId && testId) {
        setIsLoading(true);
        try {
          const project = await ProjectService.getProjectById(projectId);
          if (project) {
            setCurrentProject(project);
            await ProjectService.updateLastOpened(projectId);

            const existingTest = await TestService.getTestById(
              projectId,
              testId
            );
            setCurrentTest(existingTest);
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

    loadProjectAndTest();
  }, [projectId, navigate]);

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
      <Sidebar currentProject={currentProject} />

      <div className="flex-1 flex flex-col">
        <div className="p-6 border-b border-zinc-800">
          <TestHeader
            title="Test Details"
            subtitle="View detailed test information and results"
          />
        </div>

        <div className="flex-1 overflow-auto p-6">
          {currentTest && projectId ? (
            <TestDetails test={currentTest} projectId={projectId} />
          ) : (
            <div className="flex items-center justify-center h-full">
              <div className="text-center">
                <h1 className="text-4xl font-bold text-white mb-4">
                  Test not found
                </h1>
                <p className="text-lg text-gray-300">
                  The requested test could not be loaded
                </p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Details;
