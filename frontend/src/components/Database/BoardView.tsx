import React, { useMemo } from 'react';
import { Database, DatabaseRow, DatabaseView } from '../../types/database.types';

interface BoardViewProps {
  database: Database;
  rows: DatabaseRow[];
  view: DatabaseView;
  onRowCreate?: (properties: Record<string, any>) => Promise<void>;
  onRowUpdate?: (rowUuid: string, properties: Record<string, any>) => Promise<void>;
  onRowDelete?: (rowUuid: string) => Promise<void>;
}

export default function BoardView({
  database,
  rows,
  view,
  onRowCreate,
  onRowUpdate,
  onRowDelete,
}: BoardViewProps) {
  // Find the groupBy property (usually a select field)
  const groupByProperty = view.groupBy
    ? database.properties[view.groupBy]
    : Object.values(database.properties).find((p) => p.type === 'select');

  // Group rows by the groupBy property
  const groupedRows = useMemo(() => {
    if (!groupByProperty) {
      return { 'All': rows };
    }

    const groups: Record<string, DatabaseRow[]> = {};
    
    rows.forEach((row) => {
      const groupValue = row.properties[groupByProperty.name] || 'Uncategorized';
      if (!groups[groupValue]) {
        groups[groupValue] = [];
      }
      groups[groupValue].push(row);
    });

    return groups;
  }, [rows, groupByProperty]);

  // Get options for select property
  const groupOptions = groupByProperty?.type === 'select' ? groupByProperty.options || [] : [];

  const handleCardClick = (row: DatabaseRow) => {
    // Could open a detail modal or navigate to row page
    console.log('Card clicked:', row);
  };

  const renderCard = (row: DatabaseRow) => {
    // Get title property (first title type property or first property)
    const titleProperty = Object.values(database.properties).find((p) => p.type === 'title') 
      || Object.values(database.properties)[0];
    
    const title = titleProperty ? row.properties[titleProperty.name] || 'Untitled' : 'Untitled';

    return (
      <div
        key={row.uuid}
        onClick={() => handleCardClick(row)}
        className="bg-white p-3 rounded-lg shadow-sm border border-gray-200 hover:shadow-md transition-shadow cursor-pointer mb-2"
      >
        <div className="font-medium text-sm mb-2">{String(title)}</div>
        <div className="space-y-1">
          {Object.entries(database.properties).slice(0, 3).map(([propId, property]) => {
            if (property.type === 'title') return null;
            const value = row.properties[propId];
            if (!value) return null;
            
            return (
              <div key={propId} className="text-xs text-gray-600">
                <span className="font-medium">{property.name}:</span>{' '}
                {property.type === 'checkbox' ? (value ? '✓' : '') : String(value)}
              </div>
            );
          })}
        </div>
        {onRowDelete && (
          <button
            onClick={(e) => {
              e.stopPropagation();
              onRowDelete(row.uuid);
            }}
            className="mt-2 text-xs text-red-600 hover:text-red-800"
          >
            Delete
          </button>
        )}
      </div>
    );
  };

  return (
    <div className="flex flex-col h-full">
      <div className="flex-1 overflow-x-auto p-4">
        <div className="flex gap-4 h-full">
          {Object.entries(groupedRows).map(([groupName, groupRows]) => (
            <div key={groupName} className="flex-shrink-0 w-80 bg-gray-50 rounded-lg p-4">
              <div className="font-semibold text-sm text-gray-700 mb-3">
                {groupName} ({groupRows.length})
              </div>
              <div className="space-y-2">
                {groupRows.map((row) => renderCard(row))}
                {onRowCreate && (
                  <button
                    onClick={() => {
                      const defaultProperties: Record<string, any> = {};
                      if (groupByProperty) {
                        defaultProperties[groupByProperty.name] = groupName;
                      }
                      onRowCreate(defaultProperties);
                    }}
                    className="w-full p-2 text-sm text-gray-600 border-2 border-dashed border-gray-300 rounded-lg hover:border-gray-400 hover:text-gray-700 transition-colors"
                  >
                    + Add Card
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

