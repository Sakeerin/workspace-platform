import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { usePagesStore } from '../../store/pages';
import PageTree from './PageTree';
import WorkspaceSwitcher from './WorkspaceSwitcher';
import QuickSearch from '../Search/QuickSearch';
import useKeyboardShortcuts from '../../hooks/useKeyboardShortcuts';

export default function Sidebar() {
  const { workspaceUuid } = useParams<{ workspaceUuid: string }>();
  const navigate = useNavigate();
  const { favorites, recentlyViewed, fetchFavorites, getRecentlyViewed } = usePagesStore();
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [activeSection, setActiveSection] = useState<'pages' | 'favorites' | 'recent'>('pages');

  useEffect(() => {
    if (workspaceUuid) {
      fetchFavorites();
    }
  }, [workspaceUuid, fetchFavorites]);

  // Keyboard shortcut for search (Cmd/Ctrl+K)
  useKeyboardShortcuts([
    {
      key: 'k',
      ctrlKey: true,
      handler: () => setIsSearchOpen(true),
    },
    {
      key: 'k',
      metaKey: true,
      handler: () => setIsSearchOpen(true),
    },
  ]);

  const recentPages = getRecentlyViewed(10);

  return (
    <>
      <aside className="w-64 bg-gray-900 text-white flex flex-col h-screen">
        <div className="p-4 border-b border-gray-800">
          <WorkspaceSwitcher currentWorkspaceUuid={workspaceUuid || ''} />
        </div>

        <div className="p-4 border-b border-gray-800">
          <button
            onClick={() => setIsSearchOpen(true)}
            className="w-full px-4 py-2 text-left bg-gray-800 hover:bg-gray-700 rounded flex items-center gap-2 text-sm text-gray-300"
          >
            <svg
              className="w-4 h-4"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
              />
            </svg>
            <span>Search...</span>
            <span className="ml-auto text-xs text-gray-500">
              {navigator.platform.toUpperCase().indexOf('MAC') >= 0 ? '⌘' : 'Ctrl'}K
            </span>
          </button>
        </div>

        <nav className="flex-1 overflow-y-auto">
          <div className="p-2">
            <button
              onClick={() => setActiveSection('pages')}
              className={`w-full px-4 py-2 text-left rounded ${
                activeSection === 'pages'
                  ? 'bg-gray-800'
                  : 'hover:bg-gray-800'
              }`}
            >
              Pages
            </button>
            <button
              onClick={() => setActiveSection('favorites')}
              className={`w-full px-4 py-2 text-left rounded mt-1 ${
                activeSection === 'favorites'
                  ? 'bg-gray-800'
                  : 'hover:bg-gray-800'
              }`}
            >
              Favorites
            </button>
            <button
              onClick={() => setActiveSection('recent')}
              className={`w-full px-4 py-2 text-left rounded mt-1 ${
                activeSection === 'recent'
                  ? 'bg-gray-800'
                  : 'hover:bg-gray-800'
              }`}
            >
              Recent
            </button>
          </div>

          <div className="px-2">
            {activeSection === 'pages' && workspaceUuid && (
              <PageTree workspaceUuid={workspaceUuid} />
            )}

            {activeSection === 'favorites' && (
              <div className="space-y-1">
                {favorites.length === 0 ? (
                  <div className="px-4 py-8 text-center text-gray-500 text-sm">
                    No favorites yet
                  </div>
                ) : (
                  favorites.map((fav) => (
                    <button
                      key={fav.uuid}
                      onClick={() => navigate(`/workspaces/${workspaceUuid}/pages/${fav.uuid}`)}
                      className="w-full px-4 py-2 text-left rounded hover:bg-gray-800 flex items-center gap-2"
                    >
                      {fav.icon && <span>{fav.icon}</span>}
                      <span className="truncate">{fav.title}</span>
                    </button>
                  ))
                )}
              </div>
            )}

            {activeSection === 'recent' && (
              <div className="space-y-1">
                {recentPages.length === 0 ? (
                  <div className="px-4 py-8 text-center text-gray-500 text-sm">
                    No recently viewed pages
                  </div>
                ) : (
                  recentPages.map((page) => (
                    <button
                      key={page.uuid}
                      onClick={() => navigate(`/workspaces/${workspaceUuid}/pages/${page.uuid}`)}
                      className="w-full px-4 py-2 text-left rounded hover:bg-gray-800 flex items-center gap-2"
                    >
                      {page.icon && <span>{page.icon}</span>}
                      <span className="truncate">{page.title}</span>
                    </button>
                  ))
                )}
              </div>
            )}
          </div>
        </nav>
      </aside>

      {workspaceUuid && (
        <QuickSearch
          isOpen={isSearchOpen}
          onClose={() => setIsSearchOpen(false)}
          workspaceUuid={workspaceUuid}
        />
      )}
    </>
  );
}

