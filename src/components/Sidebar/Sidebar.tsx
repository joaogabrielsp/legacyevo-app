import React from "react";
import { useNavigate, Link, useLocation } from "react-router-dom";
import type { Project } from "../../types";

interface SidebarProps {
  currentProject: Project | null;
}

const Sidebar: React.FC<SidebarProps> = ({
  currentProject,
}) => {
  const navigate = useNavigate();
  const location = useLocation();

  const handleGoBack = () => {
    navigate('/');
  };

  const isActiveTests = currentProject && location.pathname === `/tests/${currentProject.id}`;

  return (
    <div className="w-xs h-screen flex flex-col pt-5 bg-gray-900 font-roboto text-white">
      <div className="p-6 border-b border-gray-700">
        <div className="flex items-center">
          <button
            onClick={handleGoBack}
            className="mr-3 p-2 hover:bg-gray-800 rounded-lg transition-colors"
            title="Back to Home"
          >
            <svg className="w-5 h-5 text-gray-300 hover:text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
            </svg>
          </button>
          <h1 className="text-xl text-white font-bold">LegacyEVO</h1>
        </div>
      </div>

      <div className="flex-1 p-4 space-y-4">
        <div className="bg-gray-800 rounded-lg p-4">
          <h3 className="text-sm font-medium text-gray-300 mb-2">
            Current Project
          </h3>
          {currentProject ? (
            <div>
              <p className="text-base font-medium mb-2">
                {currentProject.name}
              </p>
              <p className="text-xs">
                {currentProject.newPath}
              </p>
              <p className="text-xs">
                {currentProject.legacyPath}
              </p>
            </div>
          ) : (
            <p className="">No project selected</p>
          )}
        </div>

        {currentProject && (
          <nav className="space-y-1">
            <Link
              to={`/tests/${currentProject.id}`}
              className={`flex items-center gap-3 px-4 py-2 rounded-md transition-colors ${
                isActiveTests
                  ? 'bg-gray-700 text-white font-medium'
                  : 'text-gray-400 hover:bg-gray-800 hover:text-white'
              }`}
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" />
              </svg>
              <span>Tests</span>
            </Link>

            <Link
              to={`/executions/${currentProject.id}`}
              className="flex items-center gap-3 px-4 py-2 rounded-md text-gray-400 hover:bg-gray-800 hover:text-white transition-colors"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <span>Execution</span>
            </Link>
          </nav>
        )}
      </div>
    </div>
  );
};

export default Sidebar;