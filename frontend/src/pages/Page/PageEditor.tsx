import React, { useEffect, useState, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { usePagesStore } from '../../store/pages';
import { useEditor } from '../../hooks/useEditor';
import { useCollaboration } from '../../hooks/useCollaboration';
import { useAuthStore } from '../../store/auth';
import BlockEditor from '../../components/Editor/BlockEditor';
import PresenceIndicator from '../../components/Editor/PresenceIndicator';
import LiveCursor from '../../components/Editor/LiveCursor';
import CommentThread from '../../components/Comments/CommentThread';

export default function PageEditor() {
  const { workspaceId, pageId } = useParams<{ workspaceId: string; pageId: string }>();
  const navigate = useNavigate();
  const { pages, fetchPages, updatePage } = usePagesStore();
  const { blocks, isLoading: blocksLoading, loadBlocks, addBlock, editBlock, removeBlock } = useEditor(pageId || '');
  const { user } = useAuthStore();
  const { presence, updateCursor, isConnected } = useCollaboration({
    pageUuid: pageId || '',
  });
  const [title, setTitle] = useState('');
  const [isTitleEditing, setIsTitleEditing] = useState(false);

  const currentPage = pages.find((p) => p.uuid === pageId);

  useEffect(() => {
    if (workspaceId) {
      fetchPages(workspaceId).then(() => {
        if (pageId) {
          loadBlocks();
        }
      });
    }
  }, [workspaceId, pageId, fetchPages, loadBlocks]);

  useEffect(() => {
    if (currentPage) {
      setTitle(currentPage.title);
    }
  }, [currentPage]);

  const handleTitleChange = async (newTitle: string) => {
    const oldTitle = title;
    setTitle(newTitle);
    if (workspaceId && pageId && newTitle !== currentPage?.title) {
      try {
        await updatePage(workspaceId, pageId, { title: newTitle });
      } catch (error) {
        console.error('Failed to update page title:', error);
        setTitle(oldTitle);
      }
    }
  };

  const handleBlockCreate = async (type: string, position: number) => {
    const defaultContent: Record<string, any> = {};
    if (type === 'paragraph') {
      defaultContent.text = '';
    } else if (type.startsWith('heading')) {
      defaultContent.text = '';
    } else if (type === 'todo') {
      defaultContent.text = '';
      defaultContent.checked = false;
    } else if (type === 'bullet_list' || type === 'numbered_list') {
      defaultContent.items = [''];
    }

    try {
      await addBlock(type, defaultContent, position);
    } catch (error) {
      console.error('Failed to create block:', error);
    }
  };

  const handleBlockUpdate = async (blockUuid: string, content: Record<string, any>, properties?: Record<string, any>) => {
    try {
      await editBlock(blockUuid, content, properties);
    } catch (error) {
      console.error('Failed to update block:', error);
    }
  };

  const handleBlockDelete = async (blockUuid: string) => {
    try {
      await removeBlock(blockUuid);
    } catch (error) {
      console.error('Failed to delete block:', error);
    }
  };

  if (!currentPage && !blocksLoading) {
    return (
      <div className="p-8">
        <div className="text-center text-gray-500">Page not found</div>
      </div>
    );
  }

  // Track mouse movement for cursor updates
  const handleMouseMove = useCallback(
    (e: React.MouseEvent) => {
      if (isConnected && pageId) {
        updateCursor({
          x: e.clientX,
          y: e.clientY,
        });
      }
    },
    [isConnected, pageId, updateCursor]
  );

  return (
    <div className="flex-1 overflow-y-auto" onMouseMove={handleMouseMove}>
      <div className="max-w-4xl mx-auto p-8">
        {/* Presence Indicator */}
        {pageId && (
          <div className="mb-4">
            <PresenceIndicator users={presence} currentUserId={user?.id} />
          </div>
        )}

        {/* Live Cursors */}
        {pageId &&
          Array.from(presence.values())
            .filter((p) => p.user_id !== user?.id && p.cursor)
            .map((userPresence) => (
              <LiveCursor
                key={userPresence.user_id}
                userId={userPresence.user_id}
                userName={userPresence.user_name}
                cursor={userPresence.cursor!}
              />
            ))}

        {/* Connection Status */}
        {!isConnected && (
          <div className="mb-4 px-3 py-2 bg-yellow-50 border border-yellow-200 rounded-lg text-sm text-yellow-800">
            Reconnecting...
          </div>
        )}

        {/* Page Title */}
        <div className="mb-8">
          {isTitleEditing ? (
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              onBlur={() => {
                setIsTitleEditing(false);
                handleTitleChange(title);
              }}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  setIsTitleEditing(false);
                  handleTitleChange(title);
                }
              }}
              className="text-4xl font-bold w-full border-none outline-none focus:ring-0 bg-transparent"
              autoFocus
            />
          ) : (
            <h1
              onClick={() => setIsTitleEditing(true)}
              className="text-4xl font-bold cursor-text hover:bg-gray-50 rounded px-2 py-1 -mx-2 -my-1"
            >
              {title || 'Untitled'}
            </h1>
          )}
        </div>

        {/* Block Editor */}
        {blocksLoading ? (
          <div className="text-center text-gray-500 py-8">Loading blocks...</div>
        ) : (
          <BlockEditor
            blocks={blocks}
            onBlockCreate={handleBlockCreate}
            onBlockUpdate={handleBlockUpdate}
            onBlockDelete={handleBlockDelete}
          />
        )}

        {/* Comments Section */}
        {pageId && currentPage?.allowComments !== false && (
          <div className="mt-12">
            <CommentThread pageUuid={pageId} />
          </div>
        )}
      </div>
    </div>
  );
}
