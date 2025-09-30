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
        // Ordenar por lastOpened (mais recente primeiro)
        const sortedProjects = loadedProjects.sort((a, b) =>
          new Date(b.lastOpened!).getTime() - new Date(a.lastOpened!).getTime()
        );
        setProjects(sortedProjects);
      } catch (error) {
        console.error('Failed to load projects:', error);
      }
    };

    loadProjects();
  }, []);

    const handleCreateProject = async (projectData: NewProjectData) => {
    try {
      const newProject = await projectService.saveProject(projectData);
      setProjects(prev => {
        const updatedProjects = [...prev, newProject];
        const sortedProjects = updatedProjects.sort((a, b) =>
          new Date(b.lastOpened!).getTime() - new Date(a.lastOpened!).getTime()
        );
        return sortedProjects;
      });
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

  const handleOpenProject = async (project: Project) => {
    try {
      await projectService.updateLastOpened(project.id);
      // Atualizar a lista para reordenar
      const loadedProjects = await projectService.loadProjects();
      const sortedProjects = loadedProjects.sort((a, b) =>
        new Date(b.lastOpened!).getTime() - new Date(a.lastOpened!).getTime()
      );
      setProjects(sortedProjects);

      // Aqui depois será a navegação para a workspace
      console.log('Abrindo projeto:', project.name);
    } catch (error) {
      console.error('Failed to open project:', error);
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

          <RecentProjects
  projects={projects}
  onDeleteProject={handleDeleteProject}
  onOpenProject={handleOpenProject}
/>
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