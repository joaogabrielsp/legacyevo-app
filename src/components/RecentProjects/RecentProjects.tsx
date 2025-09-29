import { Project } from '../../types';

interface RecentProjectsProps {
  projects: Project[];
}

const RecentProjects = ({ projects }: RecentProjectsProps) => {
  if (projects.length === 0) {
    return null;
  }

  return (
    <div className="w-full max-w-4xl mb-8">
      <h2 className="text-2xl font-semibold mb-4">Recent Projects</h2>
      <div className="space-y-2">
        {projects.map((project) => (
          <div key={project.id} className="bg-zinc-800 px-4 py-3 rounded-lg border border-zinc-700 hover:border-zinc-600 transition-colors w-full">
            <div className="flex items-center justify-between">
              <div className="flex-1">
                <h3 className="text-base font-medium">{project.name}</h3>
              </div>
              <div className="text-right text-xs text-gray-300">
                <p>{project.type}</p>
                <p>{new Date(project.createdAt).toLocaleDateString()}</p>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default RecentProjects;