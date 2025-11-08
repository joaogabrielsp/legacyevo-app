import React, { useState } from 'react';
import { open } from '@tauri-apps/plugin-dialog';
import { homeDir } from '@tauri-apps/api/path';
import { exists } from '@tauri-apps/plugin-fs';
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
    type: 'Terminal' as ProjectType
  });

  const [validationErrors, setValidationErrors] = useState({
    legacyPath: '',
    newPath: ''
  });

  const [isValidating, setIsValidating] = useState(false);

  const projectTypes: ProjectType[] = ['API', 'Web', 'Terminal'];

  const validatePath = async (path: string): Promise<string> => {
    if (!path.trim()) {
      return '';
    }

    try {
      const pathExists = await exists(path);
      if (!pathExists) {
        return 'Directory not found';
      }
      return '';
    } catch (error) {
      return 'Invalid path';
    }
  };

  const validatePaths = async () => {
    setIsValidating(true);

    const [legacyError, newError] = await Promise.all([
      validatePath(formData.legacyPath),
      validatePath(formData.newPath)
    ]);

    let duplicateError = '';
    if (formData.legacyPath && formData.newPath && formData.legacyPath === formData.newPath) {
      duplicateError = 'Paths must be different';
    }

    setValidationErrors({
      legacyPath: legacyError || duplicateError,
      newPath: newError || duplicateError
    });

    setIsValidating(false);
    return !(legacyError || newError || duplicateError);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (formData.name && formData.legacyPath && formData.newPath) {
      const isValid = await validatePaths();
      if (isValid) {
        onCreateProject(formData);
      }
    }
  };

  const handleInputChange = (field: keyof typeof formData, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleFieldBlur = async (field: 'legacyPath' | 'newPath') => {
    if (formData[field]) {
      const [legacyError, newError] = await Promise.all([
        validatePath(formData.legacyPath),
        validatePath(formData.newPath)
      ]);

      let duplicateError = '';
      if (formData.legacyPath && formData.newPath && formData.legacyPath === formData.newPath) {
        duplicateError = 'Paths must be different';
      }

      setValidationErrors({
        legacyPath: legacyError || duplicateError,
        newPath: newError || duplicateError
      });
    }
  };

  const handleSelectPath = async (field: 'legacyPath' | 'newPath') => {
    try {
      const homeDirectory = await homeDir();
      const selected = await open({
        directory: true,
        multiple: false,
        title: field === 'legacyPath' ? 'Select Legacy Project Path' : 'Select New Project Path',
        defaultPath: homeDirectory
      });

      if (selected && !Array.isArray(selected)) {
        handleInputChange(field, selected);
      }
    } catch (error) {
    }
  };

  return (
    <div className="bg-zinc-800 rounded-lg shadow-2xl w-full max-w-2xl border border-zinc-700">
        <div className="bg-zinc-800 rounded-t-lg px-6 py-3 border-b border-zinc-700 relative">
          <h2 className="text-xl font-semibold text-center text-gray-100">New Project</h2>
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
            <div className="flex items-center gap-2 mb-2">
              <label className="block text-sm font-medium text-gray-300">
                Project Type
              </label>
              <span className="text-xs text-amber-400 bg-amber-400/10 px-2 py-1 rounded-full">
                Only Terminal available in this version
              </span>
            </div>
            <div className="flex border border-zinc-600 rounded-md overflow-hidden">
              {projectTypes.map((type) => (
                <button
                  key={type}
                  type="button"
                  onClick={() => handleInputChange('type', type)}
                  disabled={type === 'API' || type === 'Web'}
                  className={`
                    flex-1 px-6 py-2.5 text-sm font-medium transition-colors
                    ${type === 'API' || type === 'Web'
                      ? 'cursor-not-allowed'
                      : formData.type === type
                        ? 'bg-zinc-700 text-white border-2 border-zinc-500'
                        : 'text-gray-300 hover:bg-zinc-700/50'
                    }
                  `}
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
              className="w-full px-3 py-2 border border-gray-600 rounded-md text-gray-100 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
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
                onBlur={() => handleFieldBlur('legacyPath')}
                className={`flex-1 px-3 py-2 border rounded-md text-gray-100 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                  validationErrors.legacyPath
                    ? 'border-red-500 focus:ring-red-500'
                    : 'border-gray-600'
                }`}
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
            {validationErrors.legacyPath && (
              <p className="mt-1 text-sm text-red-400">{validationErrors.legacyPath}</p>
            )}
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
                onBlur={() => handleFieldBlur('newPath')}
                className={`flex-1 px-3 py-2 border rounded-md text-gray-100 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                  validationErrors.newPath
                    ? 'border-red-500 focus:ring-red-500'
                    : 'border-gray-600'
                }`}
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
            {validationErrors.newPath && (
              <p className="mt-1 text-sm text-red-400">{validationErrors.newPath}</p>
            )}
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
              disabled={!formData.name || !formData.legacyPath || !formData.newPath || isValidating}
              className={`px-6 py-2 rounded-md transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                !formData.name || !formData.legacyPath || !formData.newPath || isValidating
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