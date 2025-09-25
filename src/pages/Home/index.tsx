import { useState } from 'react';
import NewProjectCard from '../../components/NewProjectCard/NewProjectCard';
import { NewProjectData, Project } from '../../types';

const Home = () => {
  const [showNewProjectCard, setShowNewProjectCard] = useState(false);
  const [projects, setProjects] = useState<Project[]>([]);

  const handleCreateProject = (projectData: NewProjectData) => {
    const newProject: Project = {
      id: crypto.randomUUID(),
      name: projectData.name,
      type: projectData.type,
      legacyPath: projectData.legacyPath,
      newPath: projectData.newPath,
      createdAt: new Date()
    };

    setProjects(prev => [...prev, newProject]);
    console.log('Project created:', newProject);
    setShowNewProjectCard(false);
  };

  const handleCancel = () => {
    setShowNewProjectCard(false);
  };

  return (
    <div className="min-h-screen bg-zinc-900 flex flex-col items-center justify-center text-white relative">
      {!showNewProjectCard ? (
        <>
          <h1 className="text-6xl font-bold mb-4">Welcome to LegacyEVO!</h1>
          <p className="text-xl mb-8 text-gray-300">Faster, easier, smarter legacy system migrations.</p>
          <button
            onClick={() => setShowNewProjectCard(true)}
            className="bg-blue-600 hover:bg-blue-500 text-white px-6 py-3 rounded-lg font-medium transition-colors"
          >
            New Project
          </button>
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