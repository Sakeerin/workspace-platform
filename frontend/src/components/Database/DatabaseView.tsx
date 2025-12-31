import React from 'react';
import { Database, DatabaseView as DatabaseViewType } from '../../types/database.types';
import TableView from './TableView';
import BoardView from './BoardView';
import CalendarView from './CalendarView';

interface DatabaseViewProps {
  database: Database;
  rows: any[];
  currentViewId?: string;
  onViewChange?: (viewId: string) => void;
  onRowCreate?: (properties: Record<string, any>) => Promise<void>;
  onRowUpdate?: (rowUuid: string, properties: Record<string, any>) => Promise<void>;
  onRowDelete?: (rowUuid: string) => Promise<void>;
}

/**
 * Database View Component
 * 
 * Renders database content in different view types (table, board, calendar).
 * Supports switching between views and managing database rows.
 * 
 * @param {DatabaseViewProps} props - Component props
 * @param {Database} props.database - Database configuration
 * @param {any[]} props.rows - Array of database rows
 * @param {string} [props.currentViewId] - Currently active view ID
 * @param {Function} [props.onViewChange] - Callback when view changes
 * @param {Function} [props.onRowCreate] - Callback when row is created
 * @param {Function} [props.onRowUpdate] - Callback when row is updated
 * @param {Function} [props.onRowDelete] - Callback when row is deleted
 * 
 * @example
 * <DatabaseView
 *   database={databaseData}
 *   rows={databaseRows}
 *   onRowCreate={handleRowCreate}
 *   onRowUpdate={handleRowUpdate}
 * />
 */
export default function DatabaseView({
  database,
  rows,
  currentViewId,
  onViewChange,
  onRowCreate,
  onRowUpdate,
  onRowDelete,
}: DatabaseViewProps) {
  // Get current view
  const currentView = currentViewId
    ? database.views.find((v) => v.id === currentViewId)
    : database.views.find((v) => v.id === database.default_view_id) || database.views[0];

  // If no views exist, create a default table view
  const view = currentView || {
    id: 'default',
    type: 'table' as const,
    name: 'Table',
    filters: [],
    sorts: [],
  };

  // Render appropriate view component
  const renderView = () => {
    switch (view.type) {
      case 'table':
        return (
          <TableView
            database={database}
            rows={rows}
            view={view}
            onRowCreate={onRowCreate}
            onRowUpdate={onRowUpdate}
            onRowDelete={onRowDelete}
          />
        );
      case 'board':
        return (
          <BoardView
            database={database}
            rows={rows}
            view={view}
            onRowCreate={onRowCreate}
            onRowUpdate={onRowUpdate}
            onRowDelete={onRowDelete}
          />
        );
      case 'calendar':
        return (
          <CalendarView
            database={database}
            rows={rows}
            view={view}
            onRowCreate={onRowCreate}
            onRowUpdate={onRowUpdate}
            onRowDelete={onRowDelete}
          />
        );
      default:
        return (
          <div className="p-8 text-center text-gray-500">
            View type &quot;{view.type}&quot; is not yet implemented
          </div>
        );
    }
  };

  return (
    <div className="flex flex-col h-full">
      {/* View Switcher */}
      {database.views.length > 0 && (
        <div className="flex items-center gap-2 p-4 border-b bg-white">
          {database.views.map((v) => (
            <button
              key={v.id}
              onClick={() => onViewChange?.(v.id)}
              className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                view.id === v.id
                  ? 'bg-blue-100 text-blue-700'
                  : 'text-gray-600 hover:bg-gray-100'
              }`}
            >
              {v.name}
            </button>
          ))}
        </div>
      )}

      {/* View Content */}
      <div className="flex-1 overflow-auto">{renderView()}</div>
    </div>
  );
}

