import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import Sidebar from "../../components/Sidebar/Sidebar";
import TestHeader from "../../components/Header/Header";
import ExecutionHistory from "../../components/ExecutionHistory/ExecutionHistory";
import { Project } from "../../types";
import ProjectService from "../../services/ProjectService";

const Executions = () => {
  const { projectId } = useParams<{ projectId: string }>();
  const navigate = useNavigate();
  const [currentProject, setCurrentProject] = useState<Project | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const loadProject = async () => {
      if (projectId) {
        setIsLoading(true);
        try {
          const project = await ProjectService.getProjectById(projectId);
          if (project) {
            setCurrentProject(project);
            await ProjectService.updateLastOpened(projectId);
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

    loadProject();
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
            title="Executions Dashboard"
            subtitle="Monitor and manage your migration executions"
          />
        </div>

        <div className="flex-1 overflow-auto p-6 flex justify-center">
          {projectId && (
            <ExecutionHistory
              projectId={projectId}
            />
          )}
        </div>
      </div>
    </div>
  );
};

export default Executions;