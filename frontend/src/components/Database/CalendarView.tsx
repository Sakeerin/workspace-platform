import React, { useMemo, useState } from 'react';
import { Database, DatabaseRow, DatabaseView } from '../../types/database.types';

interface CalendarViewProps {
  database: Database;
  rows: DatabaseRow[];
  view: DatabaseView;
  onRowCreate?: (properties: Record<string, any>) => Promise<void>;
  onRowUpdate?: (rowUuid: string, properties: Record<string, any>) => Promise<void>;
  onRowDelete?: (rowUuid: string) => Promise<void>;
}

export default function CalendarView({
  database,
  rows,
  view,
  onRowCreate,
  onRowUpdate,
  onRowDelete,
}: CalendarViewProps) {
  const [currentDate, setCurrentDate] = useState(new Date());

  // Find date property
  const dateProperty = Object.values(database.properties).find((p) => p.type === 'date');

  // Group rows by date
  const rowsByDate = useMemo(() => {
    if (!dateProperty) {
      return {};
    }

    const grouped: Record<string, DatabaseRow[]> = {};
    
    rows.forEach((row) => {
      const dateValue = row.properties[dateProperty.name];
      if (dateValue) {
        const date = new Date(dateValue);
        const dateKey = date.toISOString().split('T')[0];
        if (!grouped[dateKey]) {
          grouped[dateKey] = [];
        }
        grouped[dateKey].push(row);
      }
    });

    return grouped;
  }, [rows, dateProperty]);

  // Get calendar days for current month
  const calendarDays = useMemo(() => {
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const daysInMonth = lastDay.getDate();
    const startingDayOfWeek = firstDay.getDay();

    const days: (Date | null)[] = [];
    
    // Add empty cells for days before month starts
    for (let i = 0; i < startingDayOfWeek; i++) {
      days.push(null);
    }
    
    // Add days of the month
    for (let day = 1; day <= daysInMonth; day++) {
      days.push(new Date(year, month, day));
    }
    
    return days;
  }, [currentDate]);

  const handlePreviousMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1));
  };

  const handleNextMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1));
  };

  const getRowsForDate = (date: Date | null): DatabaseRow[] => {
    if (!date || !dateProperty) return [];
    const dateKey = date.toISOString().split('T')[0];
    return rowsByDate[dateKey] || [];
  };

  const renderCell = (date: Date | null, index: number) => {
    const rowsForDate = getRowsForDate(date);
    const isToday = date && date.toDateString() === new Date().toDateString();
    const isCurrentMonth = date && date.getMonth() === currentDate.getMonth();

    return (
      <div
        key={index}
        className={`min-h-24 p-2 border border-gray-200 ${
          isCurrentMonth ? 'bg-white' : 'bg-gray-50'
        } ${isToday ? 'ring-2 ring-blue-500' : ''}`}
      >
        {date && (
          <>
            <div className={`text-sm font-medium mb-1 ${isToday ? 'text-blue-600' : 'text-gray-700'}`}>
              {date.getDate()}
            </div>
            <div className="space-y-1">
              {rowsForDate.slice(0, 3).map((row) => {
                const titleProperty = Object.values(database.properties).find((p) => p.type === 'title');
                const title = titleProperty ? row.properties[titleProperty.name] || 'Untitled' : 'Untitled';
                
                return (
                  <div
                    key={row.uuid}
                    onClick={() => console.log('Row clicked:', row)}
                    className="text-xs p-1 bg-blue-100 text-blue-800 rounded truncate cursor-pointer hover:bg-blue-200"
                    title={String(title)}
                  >
                    {String(title)}
                  </div>
                );
              })}
              {rowsForDate.length > 3 && (
                <div className="text-xs text-gray-500">+{rowsForDate.length - 3} more</div>
              )}
            </div>
          </>
        )}
      </div>
    );
  };

  const monthNames = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];

  const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

  return (
    <div className="flex flex-col h-full">
      <div className="p-4 border-b bg-white">
        <div className="flex items-center justify-between mb-4">
          <button
            onClick={handlePreviousMonth}
            className="px-3 py-1 text-sm text-gray-600 hover:text-gray-800"
          >
            ← Previous
          </button>
          <h2 className="text-lg font-semibold">
            {monthNames[currentDate.getMonth()]} {currentDate.getFullYear()}
          </h2>
          <button
            onClick={handleNextMonth}
            className="px-3 py-1 text-sm text-gray-600 hover:text-gray-800"
          >
            Next →
          </button>
        </div>
        {!dateProperty && (
          <div className="text-sm text-amber-600 bg-amber-50 p-2 rounded">
            No date property found. Calendar view requires a date property.
          </div>
        )}
      </div>
      
      <div className="flex-1 overflow-auto p-4">
        <div className="grid grid-cols-7 gap-0">
          {/* Day headers */}
          {dayNames.map((day) => (
            <div key={day} className="p-2 text-center text-sm font-medium text-gray-700 bg-gray-50">
              {day}
            </div>
          ))}
          
          {/* Calendar cells */}
          {calendarDays.map((date, index) => renderCell(date, index))}
        </div>
      </div>
    </div>
  );
}

