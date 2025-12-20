import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import api from '../../services/api';

interface Workspace {
  uuid: string;
  name: string;
  icon?: string;
}

export default function WorkspaceSettings() {
  const { workspaceId } = useParams<{ workspaceId: string }>();
  const [workspace, setWorkspace] = useState<Workspace | null>(null);
  const [name, setName] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (workspaceId) {
      loadWorkspace();
    }
  }, [workspaceId]);

  const loadWorkspace = async () => {
    try {
      const response = await api.get<{ success: boolean; data: Workspace }>(
        `/workspaces/${workspaceId}`
      );
      setWorkspace(response.data);
      setName(response.data.name);
    } catch (err: any) {
      setError(err.message || 'Failed to load workspace');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');

    try {
      const response = await api.patch<{ success: boolean; data: Workspace }>(
        `/workspaces/${workspaceId}`,
        { name }
      );
      setWorkspace(response.data);
    } catch (err: any) {
      setError(err.message || 'Failed to update workspace');
    } finally {
      setIsLoading(false);
    }
  };

  if (!workspace) {
    return <div>Loading...</div>;
  }

  return (
    <div className="p-8 max-w-2xl mx-auto">
      <h1 className="text-2xl font-bold mb-6">Workspace Settings</h1>
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded mb-4">
          {error}
        </div>
      )}
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label htmlFor="name" className="block text-sm font-medium text-gray-700">
            Workspace Name
          </label>
          <input
            id="name"
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
            required
          />
        </div>
        <button
          type="submit"
          disabled={isLoading}
          className="px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 disabled:opacity-50"
        >
          {isLoading ? 'Saving...' : 'Save Changes'}
        </button>
      </form>
    </div>
  );
}

