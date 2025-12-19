import React from 'react';

export default function WorkspaceList() {
  return (
    <div className="p-8">
      <h1 className="text-2xl font-bold mb-4">Workspaces</h1>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Workspace cards will be added here */}
        <div className="border rounded-lg p-4 hover:shadow-lg transition-shadow">
          <h3 className="font-semibold">My Workspace</h3>
          <p className="text-gray-600 text-sm mt-2">Create a new workspace</p>
        </div>
      </div>
    </div>
  );
}

