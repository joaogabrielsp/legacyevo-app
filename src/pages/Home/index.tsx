import { useState, useEffect } from 'react';
import NewProjectCard from '../../components/NewProjectCard/NewProjectCard';
import RecentProjects from '../../components/RecentProjects/RecentProjects';
import { NewProjectData, Project } from '../../types';
import projectService from '../../services/ProjectService';
import { confirm } from '@tauri-apps/plugin-dialog';

const Home = () => {
  const [showNewProjectCard, setShowNewProjectCard] = useState(false);
  const [projects, setProjects] = useState<Project[]>([]);

  useEffect(() => {
    const loadProjects = async () => {
      try {
        const loadedProjects = await projectService.loadProjects();
        setProjects(loadedProjects);
      } catch (error) {
        console.error('Failed to load projects:', error);
      }
    };

    loadProjects();
  }, []);

    const handleCreateProject = async (projectData: NewProjectData) => {
    try {
      const newProject = await projectService.saveProject(projectData);
      setProjects(prev => [...prev, newProject]);
      setShowNewProjectCard(false);
    } catch (error) {
      console.error('Failed to create project:', error);
    }
  };

  const handleCancel = () => {
    setShowNewProjectCard(false);
  };

  const handleDeleteProject = async (id: string) => {
    const confirmed = await confirm('Are you sure you want to delete this project?', {
      kind: 'warning',
      title: 'Delete Project',
      okLabel: 'Delete',
      cancelLabel: 'Cancel'
    });

    if (confirmed) {
      try {
        await projectService.deleteProject(id);
        setProjects(prev => prev.filter(p => p.id !== id));
      } catch (error) {
        console.error('Failed to delete project:', error);
      }
    }
  };

  return (
    <div className="min-h-screen bg-zinc-900 flex flex-col items-center justify-center text-white relative">
      {!showNewProjectCard ? (
        <>
          <h1 className={`text-6xl font-bold mb-4 ${projects.length >= 3 ? 'mt-24' : ''}`}>Welcome to LegacyEVO!</h1>
          <p className="text-xl mb-8 text-gray-300">Faster, easier, smarter legacy system migrations.</p>

          <button
            onClick={() => setShowNewProjectCard(true)}
            className="bg-blue-600 hover:bg-blue-500 text-white px-6 mb-12 py-3 rounded-lg font-medium transition-colors"
          >
            New Project
          </button>

          <RecentProjects projects={projects} onDeleteProject={handleDeleteProject} />
        </>
      ) : (
        <div className="flex items-center justify-center w-full">
          <NewProjectCard
            onCreateProject={handleCreateProject}
            onCancel={handleCancel}
          />
        </div>
      )}
    </div>
  );
};

export default Home;