import { Project } from '../../types';
import DropdownMenu from '../DropdownMenu/DropdownMenu';

interface RecentProjectsProps {
  projects: Project[];
  onDeleteProject: (id: string) => void;
}

const RecentProjects = ({ projects, onDeleteProject }: RecentProjectsProps) => {
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
              <div className="flex items-center space-x-4">
                <div className="text-right text-xs text-gray-300">
                  <p>{project.type}</p>
                  <p>{new Date(project.createdAt).toLocaleDateString()}</p>
                </div>
                <DropdownMenu onDelete={() => onDeleteProject(project.id)}>
                  <svg className="w-5 h-5 text-gray-400 hover:text-white" fill="currentColor" viewBox="0 0 20 20">
                    <path d="M10 6a2 2 0 110-4 2 2 0 010 4zM10 12a2 2 0 110-4 2 2 0 010 4zM10 18a2 2 0 110-4 2 2 0 010 4z" />
                  </svg>
                </DropdownMenu>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default RecentProjects;