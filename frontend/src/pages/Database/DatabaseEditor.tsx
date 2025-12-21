import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useDatabaseStore } from '../../store/database';
import { usePagesStore } from '../../store/pages';
import DatabaseView from '../../components/Database/DatabaseView';
import { DatabaseRow } from '../../types/database.types';

export default function DatabaseEditor() {
  const { workspaceId, pageId } = useParams<{ workspaceId: string; pageId: string }>();
  const navigate = useNavigate();
  const { currentPage } = usePagesStore();
  const {
    currentDatabase,
    rows,
    currentView,
    isLoading,
    error,
    fetchDatabase,
    createDatabase,
    updateDatabase,
    createRow,
    updateRow,
    deleteRow,
    setCurrentView,
  } = useDatabaseStore();

  const [databaseUuid, setDatabaseUuid] = useState<string | null>(null);

  useEffect(() => {
    if (!pageId) return;

    // First, try to fetch the database by page ID
    // In a real implementation, you might have an endpoint to get database by page ID
    // For now, we'll assume the database UUID is the same as page UUID or we need to create it
    const loadDatabase = async () => {
      try {
        // Check if database exists - in a real app, you'd have an endpoint for this
        // For now, we'll try to fetch it using pageId as databaseUuid
        // This is a simplification - in production, you'd have a proper endpoint
        await fetchDatabase(pageId);
        setDatabaseUuid(pageId);
      } catch (err: any) {
        // If database doesn't exist, create it
        if (err.response?.status === 404 && currentPage && workspaceId) {
          try {
            const newDatabase = await createDatabase(workspaceId, {
              page_id: pageId,
              title: currentPage.title,
              properties: {
                title: {
                  type: 'title',
                  name: 'Name',
                },
              },
              views: [
                {
                  id: 'table-view',
                  type: 'table',
                  name: 'Table',
                  filters: [],
                  sorts: [],
                },
              ],
              default_view_id: 'table-view',
            });
            setDatabaseUuid(newDatabase.uuid);
          } catch (createErr) {
            console.error('Failed to create database:', createErr);
          }
        } else {
          console.error('Failed to load database:', err);
        }
      }
    };

    loadDatabase();
  }, [pageId, workspaceId, currentPage, fetchDatabase, createDatabase]);

  const handleRowCreate = async (properties: Record<string, any>) => {
    if (!databaseUuid) return;
    try {
      await createRow(databaseUuid, { properties });
    } catch (error) {
      console.error('Failed to create row:', error);
      throw error;
    }
  };

  const handleRowUpdate = async (rowUuid: string, properties: Record<string, any>) => {
    if (!databaseUuid) return;
    try {
      await updateRow(databaseUuid, rowUuid, { properties });
    } catch (error) {
      console.error('Failed to update row:', error);
      throw error;
    }
  };

  const handleRowDelete = async (rowUuid: string) => {
    if (!databaseUuid) return;
    try {
      await deleteRow(databaseUuid, rowUuid);
    } catch (error) {
      console.error('Failed to delete row:', error);
      throw error;
    }
  };

  const handleViewChange = (viewId: string) => {
    setCurrentView(viewId);
  };

  if (isLoading && !currentDatabase) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-gray-500">Loading database...</div>
      </div>
    );
  }

  if (error && !currentDatabase) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-red-500">Error: {error}</div>
      </div>
    );
  }

  if (!currentDatabase) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-gray-500">Database not found</div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-screen">
      {/* Header */}
      <div className="p-6 border-b bg-white">
        <h1 className="text-2xl font-bold text-gray-900">{currentDatabase.title || 'Untitled Database'}</h1>
        {currentDatabase.description && (
          <p className="mt-2 text-sm text-gray-600">{currentDatabase.description}</p>
        )}
      </div>

      {/* Database View */}
      <div className="flex-1 overflow-hidden">
        <DatabaseView
          database={currentDatabase}
          rows={rows}
          currentViewId={currentView || undefined}
          onViewChange={handleViewChange}
          onRowCreate={handleRowCreate}
          onRowUpdate={handleRowUpdate}
          onRowDelete={handleRowDelete}
        />
      </div>
    </div>
  );
}

