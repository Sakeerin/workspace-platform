import React, { useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { usePagesStore } from '../../store/pages';

interface Page {
  uuid: string;
  title: string;
  icon?: string;
  parent_id?: string;
}

export default function PageTree() {
  const navigate = useNavigate();
  const { workspaceId } = useParams<{ workspaceId: string }>();
  const { pages, isLoading, fetchPages } = usePagesStore();

  useEffect(() => {
    if (workspaceId) {
      fetchPages(workspaceId);
    }
  }, [workspaceId, fetchPages]);

  const getChildPages = (parentId?: string): Page[] => {
    return pages.filter((page) => page.parent_id === parentId);
  };

  const renderPageTree = (parentId?: string, depth = 0): React.ReactNode => {
    const childPages = getChildPages(parentId);

    if (childPages.length === 0) {
      return null;
    }

    return (
      <ul className={depth > 0 ? 'ml-4 mt-1' : ''}>
        {childPages.map((page) => (
          <li key={page.uuid} className="mb-1">
            <button
              onClick={() => navigate(`/workspaces/${workspaceId}/pages/${page.uuid}`)}
              className="w-full text-left px-3 py-1.5 rounded hover:bg-gray-800 flex items-center gap-2 text-sm"
            >
              {page.icon && <span>{page.icon}</span>}
              <span className="truncate">{page.title}</span>
            </button>
            {renderPageTree(page.uuid, depth + 1)}
          </li>
        ))}
      </ul>
    );
  };

  if (isLoading) {
    return (
      <div className="p-4 text-gray-400 text-sm">Loading pages...</div>
    );
  }

  if (pages.length === 0) {
    return (
      <div className="p-4 text-gray-400 text-sm">
        No pages yet. Create one to get started.
      </div>
    );
  }

  return (
    <div className="p-2">
      <h2 className="px-3 py-2 text-xs font-semibold text-gray-400 uppercase tracking-wider">
        Pages
      </h2>
      {renderPageTree()}
    </div>
  );
}

