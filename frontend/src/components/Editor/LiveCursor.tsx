import React, { useEffect, useState } from 'react';

interface Cursor {
  x: number;
  y: number;
  block_uuid?: string;
}

interface LiveCursorProps {
  userId: string;
  userName: string;
  cursor: Cursor;
  color?: string;
}

/**
 * LiveCursor Component
 * 
 * Displays a live cursor indicator for another user's cursor position
 */
export default function LiveCursor({ userId, userName, cursor, color }: LiveCursorProps) {
  const [position, setPosition] = useState({ x: cursor.x, y: cursor.y });

  useEffect(() => {
    // Smooth cursor movement
    setPosition({ x: cursor.x, y: cursor.y });
  }, [cursor.x, cursor.y]);

  const getColor = () => {
    if (color) return color;
    const colors = [
      '#3B82F6', // blue
      '#10B981', // green
      '#F59E0B', // yellow
      '#8B5CF6', // purple
      '#EC4899', // pink
      '#6366F1', // indigo
      '#EF4444', // red
      '#F97316', // orange
    ];
    const index = userId.charCodeAt(0) % colors.length;
    return colors[index];
  };

  const cursorColor = getColor();

  if (position.x === 0 && position.y === 0) {
    return null;
  }

  return (
    <div
      className="fixed pointer-events-none z-50 transition-all duration-100 ease-out"
      style={{
        left: `${position.x}px`,
        top: `${position.y}px`,
        transform: 'translate(-2px, -2px)',
      }}
    >
      {/* Cursor line */}
      <div
        className="absolute w-0.5 h-5"
        style={{
          backgroundColor: cursorColor,
        }}
      />
      {/* User label */}
      <div
        className="absolute top-6 left-0 px-2 py-1 rounded text-xs text-white whitespace-nowrap shadow-md"
        style={{
          backgroundColor: cursorColor,
        }}
      >
        {userName}
      </div>
    </div>
  );
}

