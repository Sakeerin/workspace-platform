import React, { useState, useMemo } from 'react';
import { Database, DatabaseRow, DatabaseView } from '../../types/database.types';

interface TableViewProps {
  database: Database;
  rows: DatabaseRow[];
  view: DatabaseView;
  onRowCreate?: (properties: Record<string, any>) => Promise<void>;
  onRowUpdate?: (rowUuid: string, properties: Record<string, any>) => Promise<void>;
  onRowDelete?: (rowUuid: string) => Promise<void>;
}

export default function TableView({
  database,
  rows,
  view,
  onRowCreate,
  onRowUpdate,
  onRowDelete,
}: TableViewProps) {
  const [editingCell, setEditingCell] = useState<{ rowUuid: string; property: string } | null>(null);
  const [editValue, setEditValue] = useState<any>('');

  // Get visible properties from view or use all properties
  const visibleProperties = useMemo(() => {
    if (view.properties) {
      return Object.keys(database.properties).filter((propId) => {
        const viewProp = view.properties?.[propId];
        return viewProp?.visible !== false;
      });
    }
    return Object.keys(database.properties);
  }, [database.properties, view.properties]);

  // Apply filters
  const filteredRows = useMemo(() => {
    let result = [...rows];
    
    if (view.filters && view.filters.length > 0) {
      result = result.filter((row) => {
        return view.filters!.every((filter) => {
          const value = row.properties[filter.property];
          
          switch (filter.operator) {
            case 'equals':
              return value === filter.value;
            case 'not_equals':
              return value !== filter.value;
            case 'contains':
              return String(value).toLowerCase().includes(String(filter.value).toLowerCase());
            case 'not_contains':
              return !String(value).toLowerCase().includes(String(filter.value).toLowerCase());
            case 'greater_than':
              return Number(value) > Number(filter.value);
            case 'less_than':
              return Number(value) < Number(filter.value);
            case 'is_empty':
              return value === null || value === undefined || value === '';
            case 'is_not_empty':
              return value !== null && value !== undefined && value !== '';
            default:
              return true;
          }
        });
      });
    }
    
    return result;
  }, [rows, view.filters]);

  // Apply sorts
  const sortedRows = useMemo(() => {
    if (!view.sorts || view.sorts.length === 0) {
      return filteredRows.sort((a, b) => a.position - b.position);
    }

    return [...filteredRows].sort((a, b) => {
      for (const sort of view.sorts!) {
        const aValue = a.properties[sort.property];
        const bValue = b.properties[sort.property];
        
        let comparison = 0;
        if (aValue < bValue) comparison = -1;
        if (aValue > bValue) comparison = 1;
        
        if (comparison !== 0) {
          return sort.direction === 'asc' ? comparison : -comparison;
        }
      }
      return 0;
    });
  }, [filteredRows, view.sorts]);

  const handleCellClick = (rowUuid: string, property: string) => {
    const row = rows.find((r) => r.uuid === rowUuid);
    if (row) {
      setEditingCell({ rowUuid, property });
      setEditValue(row.properties[property] || '');
    }
  };

  const handleCellSave = async () => {
    if (!editingCell || !onRowUpdate) return;

    try {
      await onRowUpdate(editingCell.rowUuid, {
        [editingCell.property]: editValue,
      });
      setEditingCell(null);
      setEditValue('');
    } catch (error) {
      console.error('Failed to update cell:', error);
    }
  };

  const handleCellCancel = () => {
    setEditingCell(null);
    setEditValue('');
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleCellSave();
    } else if (e.key === 'Escape') {
      handleCellCancel();
    }
  };

  const renderCellValue = (row: DatabaseRow, propertyId: string) => {
    const property = database.properties[propertyId];
    const value = row.properties[propertyId];

    if (editingCell?.rowUuid === row.uuid && editingCell?.property === propertyId) {
      return (
        <input
          type="text"
          value={editValue}
          onChange={(e) => setEditValue(e.target.value)}
          onBlur={handleCellSave}
          onKeyDown={handleKeyDown}
          className="w-full px-2 py-1 border border-blue-500 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
          autoFocus
        />
      );
    }

    if (value === null || value === undefined || value === '') {
      return <span className="text-gray-400">Empty</span>;
    }

    switch (property.type) {
      case 'checkbox':
        return <input type="checkbox" checked={Boolean(value)} readOnly />;
      case 'date':
        return <span>{new Date(value).toLocaleDateString()}</span>;
      case 'select':
      case 'multi_select':
        if (Array.isArray(value)) {
          return <span>{value.join(', ')}</span>;
        }
        return <span>{String(value)}</span>;
      default:
        return <span>{String(value)}</span>;
    }
  };

  const handleAddRow = async () => {
    if (!onRowCreate) return;

    const defaultProperties: Record<string, any> = {};
    Object.keys(database.properties).forEach((propId) => {
      const prop = database.properties[propId];
      if (prop.type === 'checkbox') {
        defaultProperties[propId] = false;
      } else if (prop.type === 'number') {
        defaultProperties[propId] = 0;
      } else {
        defaultProperties[propId] = '';
      }
    });

    try {
      await onRowCreate(defaultProperties);
    } catch (error) {
      console.error('Failed to create row:', error);
    }
  };

  return (
    <div className="flex flex-col h-full">
      <div className="flex-1 overflow-auto">
        <table className="w-full border-collapse">
          <thead className="bg-gray-50 sticky top-0">
            <tr>
              {visibleProperties.map((propId) => {
                const property = database.properties[propId];
                return (
                  <th
                    key={propId}
                    className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider border-b"
                  >
                    {property.name}
                  </th>
                );
              })}
              {onRowDelete && <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider border-b w-20"></th>}
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {sortedRows.map((row) => (
              <tr key={row.uuid} className="hover:bg-gray-50">
                {visibleProperties.map((propId) => (
                  <td
                    key={propId}
                    onClick={() => handleCellClick(row.uuid, propId)}
                    className="px-4 py-3 text-sm text-gray-900 cursor-pointer"
                  >
                    {renderCellValue(row, propId)}
                  </td>
                ))}
                {onRowDelete && (
                  <td className="px-4 py-3 text-sm">
                    <button
                      onClick={() => onRowDelete(row.uuid)}
                      className="text-red-600 hover:text-red-800"
                    >
                      Delete
                    </button>
                  </td>
                )}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {onRowCreate && (
        <div className="p-4 border-t bg-white">
          <button
            onClick={handleAddRow}
            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
          >
            Add Row
          </button>
        </div>
      )}
    </div>
  );
}

