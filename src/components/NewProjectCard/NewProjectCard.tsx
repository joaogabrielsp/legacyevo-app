import React, { useState } from 'react';
import { open } from '@tauri-apps/plugin-dialog';
import { NewProjectData, ProjectType } from '../../types';

interface NewProjectCardProps {
  onCreateProject: (projectData: NewProjectData) => void;
  onCancel?: () => void;
}

const NewProjectCard: React.FC<NewProjectCardProps> = ({
  onCreateProject,
  onCancel,
}) => {
  const [formData, setFormData] = useState({
    name: '',
    legacyPath: '',
    newPath: '',
    type: 'Web' as ProjectType
  });

  const projectTypes: ProjectType[] = ['API', 'Web', 'Terminal'];

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (formData.name && formData.legacyPath && formData.newPath) {
      onCreateProject(formData);
    }
  };

  const handleInputChange = (field: keyof typeof formData, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleSelectPath = async (field: 'legacyPath' | 'newPath') => {
    try {
      const selected = await open({
        directory: true,
        multiple: false,
        title: field === 'legacyPath' ? 'Select Legacy Project Path' : 'Select New Project Path'
      });

      if (selected && !Array.isArray(selected)) {
        handleInputChange(field, selected);
      }
    } catch (error) {
      console.error('Error selecting path:', error);
    }
  };

  return (
    <div className="bg-zinc-900 rounded-lg shadow-2xl w-full max-w-2xl border border-gray-700">
        <div className="bg-neutral-800 rounded-t-lg px-6 py-4 border-b border-gray-700 relative">
          <h2 className="text-2xl font-bold text-center text-gray-100">New Project</h2>
          <button
            type="button"
            onClick={onCancel}
            className="absolute right-4 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-200 transition-colors focus:outline-none focus:bg-neutral-700 rounded-full p-1"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Project Type
            </label>
            <div className="grid grid-cols-3 gap-3">
              {projectTypes.map((type) => (
                <button
                  key={type}
                  type="button"
                  onClick={() => handleInputChange('type', type)}
                  className={`px-4 py-3 rounded-md border transition-colors ${
                    formData.type === type
                      ? 'bg-blue-600 border-blue-500 text-white'
                      : 'bg-gray-700 border-gray-600 text-gray-300 hover:bg-gray-600'
                  }`}
                >
                  {type}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Project Name
            </label>
            <input
              type="text"
              value={formData.name}
              onChange={(e) => handleInputChange('name', e.target.value)}
              className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-md text-gray-100 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="Enter project name"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Legacy Project Path
            </label>
            <div className="flex space-x-2">
              <input
                type="text"
                value={formData.legacyPath}
                onChange={(e) => handleInputChange('legacyPath', e.target.value)}
                className="flex-1 px-3 py-2 bg-gray-700 border border-gray-600 rounded-md text-gray-100 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="Enter legacy project path"
                required
              />
              <button
                type="button"
                onClick={() => handleSelectPath('legacyPath')}
                className="px-4 py-2 bg-gray-600 text-gray-300 rounded-md hover:bg-gray-500 transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                Browse
              </button>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              New Project Path
            </label>
            <div className="flex space-x-2">
              <input
                type="text"
                value={formData.newPath}
                onChange={(e) => handleInputChange('newPath', e.target.value)}
                className="flex-1 px-3 py-2 bg-gray-700 border border-gray-600 rounded-md text-gray-100 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="Enter new project path"
                required
              />
              <button
                type="button"
                onClick={() => handleSelectPath('newPath')}
                className="px-4 py-2 bg-gray-600 text-gray-300 rounded-md hover:bg-gray-500 transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                Browse
              </button>
            </div>
          </div>

          <div className="flex justify-end space-x-3 pt-4">
            <button
              type="button"
              onClick={onCancel}
              className="px-6 py-2 bg-gray-600 text-gray-300 rounded-md hover:bg-gray-500 transition-colors focus:outline-none focus:ring-2 focus:ring-gray-500"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={!formData.name || !formData.legacyPath || !formData.newPath}
              className={`px-6 py-2 rounded-md transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                !formData.name || !formData.legacyPath || !formData.newPath
                  ? 'bg-blue-400 cursor-not-allowed text-gray-200'
                  : 'bg-blue-600 hover:bg-blue-500 text-white'
              }`}
            >
              Create
            </button>
          </div>
        </form>
      </div>
  );
};

export default NewProjectCard;