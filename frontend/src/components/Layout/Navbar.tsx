import React from 'react';

export default function Navbar() {
  return (
    <nav className="bg-white border-b border-gray-200 px-6 py-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <h2 className="text-lg font-semibold">Page Title</h2>
        </div>
        <div className="flex items-center space-x-4">
          <button className="px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-100 rounded">
            Share
          </button>
          <button className="px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-100 rounded">
            Settings
          </button>
        </div>
      </div>
    </nav>
  );
}

