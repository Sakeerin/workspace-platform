import React from 'react';

export default function Sidebar() {
  return (
    <aside className="w-64 bg-gray-900 text-white flex flex-col">
      <div className="p-4">
        <h1 className="text-xl font-bold">Workspace</h1>
      </div>
      <nav className="flex-1 overflow-y-auto p-4">
        <ul className="space-y-2">
          <li>
            <a href="#" className="block px-4 py-2 rounded hover:bg-gray-800">
              Pages
            </a>
          </li>
          <li>
            <a href="#" className="block px-4 py-2 rounded hover:bg-gray-800">
              Favorites
            </a>
          </li>
          <li>
            <a href="#" className="block px-4 py-2 rounded hover:bg-gray-800">
              Recent
            </a>
          </li>
        </ul>
      </nav>
    </aside>
  );
}

