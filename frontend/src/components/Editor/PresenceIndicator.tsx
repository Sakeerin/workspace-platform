import React from 'react';

interface PresenceUser {
  user_id: string;
  user_name: string;
  user_email: string;
  cursor?: {
    x: number;
    y: number;
    block_uuid?: string;
  };
  last_seen: string;
}

interface PresenceIndicatorProps {
  users: Map<string, PresenceUser>;
  currentUserId?: string;
}

/**
 * PresenceIndicator Component
 * 
 * Displays avatars/names of users currently viewing/editing the page
 */
export default function PresenceIndicator({ users, currentUserId }: PresenceIndicatorProps) {
  const otherUsers = Array.from(users.values()).filter(
    (user) => user.user_id !== currentUserId
  );

  if (otherUsers.length === 0) {
    return null;
  }

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map((n) => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  const getColor = (userId: string) => {
    // Generate a consistent color based on user ID
    const colors = [
      'bg-blue-500',
      'bg-green-500',
      'bg-yellow-500',
      'bg-purple-500',
      'bg-pink-500',
      'bg-indigo-500',
      'bg-red-500',
      'bg-orange-500',
    ];
    const index = userId.charCodeAt(0) % colors.length;
    return colors[index];
  };

  return (
    <div className="flex items-center gap-2 px-3 py-2 bg-white border border-gray-200 rounded-lg shadow-sm">
      <span className="text-xs text-gray-500 mr-1">Viewing:</span>
      <div className="flex items-center gap-1">
        {otherUsers.slice(0, 5).map((user) => (
          <div
            key={user.user_id}
            className={`w-6 h-6 rounded-full ${getColor(user.user_id)} flex items-center justify-center text-white text-xs font-medium`}
            title={user.user_name}
          >
            {getInitials(user.user_name)}
          </div>
        ))}
        {otherUsers.length > 5 && (
          <div className="w-6 h-6 rounded-full bg-gray-300 flex items-center justify-center text-gray-600 text-xs font-medium">
            +{otherUsers.length - 5}
          </div>
        )}
      </div>
    </div>
  );
}

