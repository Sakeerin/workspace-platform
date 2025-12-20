import React, { useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useWorkspaceStore } from '../../store/workspace';
import { useAuthStore } from '../../store/auth';

export default function WorkspaceList() {
  const navigate = useNavigate();
  const { workspaces, fetchWorkspaces, isLoading, error } = useWorkspaceStore();
  const { logout } = useAuthStore();

  useEffect(() => {
    fetchWorkspaces();
  }, [fetchWorkspaces]);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <div className="p-8">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Workspaces</h1>
        <div className="flex gap-4">
          <Link
            to="/workspaces/create"
            className="px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700"
          >
            Create Workspace
          </Link>
          <button
            onClick={handleLogout}
            className="px-4 py-2 border border-gray-300 rounded-md hover:bg-gray-50"
          >
            Logout
          </button>
        </div>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded mb-4">
          {error}
        </div>
      )}

      {isLoading ? (
        <div>Loading workspaces...</div>
      ) : workspaces.length === 0 ? (
        <div className="text-center py-12">
          <p className="text-gray-600 mb-4">No workspaces yet</p>
          <Link
            to="/workspaces/create"
            className="text-indigo-600 hover:text-indigo-500"
          >
            Create your first workspace
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {workspaces.map((workspace) => (
            <Link
              key={workspace.uuid}
              to={`/workspaces/${workspace.uuid}`}
              className="border rounded-lg p-4 hover:shadow-lg transition-shadow"
            >
              <h3 className="font-semibold">{workspace.name}</h3>
              <p className="text-gray-600 text-sm mt-2">Plan: {workspace.plan}</p>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}

