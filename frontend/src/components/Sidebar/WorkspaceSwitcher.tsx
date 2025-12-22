import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useWorkspaceStore } from '../../store/workspace';
import api from '../../services/api';

interface Workspace {
  uuid: string;
  name: string;
  slug: string;
  icon?: string;
}

interface WorkspaceSwitcherProps {
  currentWorkspaceUuid: string;
}

export default function WorkspaceSwitcher({ currentWorkspaceUuid }: WorkspaceSwitcherProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [workspaces, setWorkspaces] = useState<Workspace[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();
  const { setCurrentWorkspace } = useWorkspaceStore();

  const fetchWorkspaces = async () => {
    setIsLoading(true);
    try {
      const response = await api.get<{
        success: boolean;
        data: Workspace[];
      }>('/workspaces');

      setWorkspaces(response.data);
    } catch (error) {
      console.error('Failed to fetch workspaces:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleToggle = () => {
    if (!isOpen) {
      fetchWorkspaces();
    }
    setIsOpen(!isOpen);
  };

  const handleSelectWorkspace = (workspace: Workspace) => {
    setCurrentWorkspace(workspace);
    navigate(`/workspaces/${workspace.uuid}`);
    setIsOpen(false);
  };

  const currentWorkspace = workspaces.find((w) => w.uuid === currentWorkspaceUuid);

  return (
    <div className="relative">
      <button
        onClick={handleToggle}
        className="w-full px-4 py-2 text-left hover:bg-gray-800 rounded flex items-center justify-between"
      >
        <div className="flex items-center gap-2">
          {currentWorkspace?.icon && (
            <span className="text-lg">{currentWorkspace.icon}</span>
          )}
          <span className="font-medium">{currentWorkspace?.name || 'Select Workspace'}</span>
        </div>
        <svg
          className={`w-4 h-4 transition-transform ${isOpen ? 'rotate-180' : ''}`}
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M19 9l-7 7-7-7"
          />
        </svg>
      </button>

      {isOpen && (
        <>
          <div
            className="fixed inset-0 z-10"
            onClick={() => setIsOpen(false)}
          />
          <div className="absolute top-full left-0 right-0 mt-1 bg-gray-800 border border-gray-700 rounded-lg shadow-xl z-20 max-h-64 overflow-y-auto">
            {isLoading ? (
              <div className="p-4 text-center text-gray-400">Loading...</div>
            ) : (
              <div className="py-2">
                {workspaces.map((workspace) => (
                  <button
                    key={workspace.uuid}
                    onClick={() => handleSelectWorkspace(workspace)}
                    className={`w-full px-4 py-2 text-left hover:bg-gray-700 flex items-center gap-2 ${
                      workspace.uuid === currentWorkspaceUuid
                        ? 'bg-gray-700'
                        : ''
                    }`}
                  >
                    {workspace.icon && <span>{workspace.icon}</span>}
                    <span>{workspace.name}</span>
                  </button>
                ))}
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
}

