import { useEffect, useState, useCallback, useRef } from 'react';
import * as Y from 'yjs';
import { useWebSocket } from './useWebSocket';
import { yjsProvider } from '../services/yjs-provider';
import { useAuthStore } from '../store/auth';

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

interface UseCollaborationOptions {
  pageUuid: string;
}

interface UseCollaborationReturn {
  presence: Map<string, PresenceUser>;
  updateCursor: (cursor: { x: number; y: number; block_uuid?: string }) => void;
  isConnected: boolean;
}

/**
 * Hook for managing real-time collaboration (presence, cursors, etc.)
 */
export function useCollaboration(options: UseCollaborationOptions): UseCollaborationReturn {
  const { pageUuid } = options;
  const { accessToken, user } = useAuthStore();
  const { socket, isConnected, emit, on, off } = useWebSocket({ pageUuid, autoConnect: true });
  const [presence, setPresence] = useState<Map<string, PresenceUser>>(new Map());
  const presenceMapRef = useRef<Y.Map<any> | null>(null);
  const cursorUpdateTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Initialize Yjs presence map
  useEffect(() => {
    if (!pageUuid || !accessToken) {
      return;
    }

    // Connect Yjs provider
    yjsProvider.connectProvider(pageUuid, accessToken);
    const presenceMap = yjsProvider.getPresenceMap(pageUuid);
    presenceMapRef.current = presenceMap;

    // Listen to presence changes
    const updatePresence = () => {
      const newPresence = new Map<string, PresenceUser>();
      presenceMap.forEach((value, key) => {
        newPresence.set(key, value as PresenceUser);
      });
      setPresence(newPresence);
    };

    presenceMap.observe(updatePresence);
    updatePresence(); // Initial update

    return () => {
      presenceMap.unobserve(updatePresence);
    };
  }, [pageUuid, accessToken]);

  // Listen to WebSocket presence events
  useEffect(() => {
    if (!socket) {
      return;
    }

    const handleUserJoined = (data: { user: any; page_id: string }) => {
      if (data.page_id === pageUuid && presenceMapRef.current) {
        presenceMapRef.current.set(data.user.id, {
          user_id: data.user.id,
          user_name: data.user.name,
          user_email: data.user.email,
          last_seen: new Date().toISOString(),
        });
      }
    };

    const handleUserLeft = (data: { user: any; page_id: string }) => {
      if (data.page_id === pageUuid && presenceMapRef.current) {
        presenceMapRef.current.delete(data.user.id);
      }
    };

    const handlePresenceUpdate = (data: { users: PresenceUser[]; page_id: string }) => {
      if (data.page_id === pageUuid && presenceMapRef.current) {
        data.users.forEach((user) => {
          presenceMapRef.current!.set(user.user_id, user);
        });
      }
    };

    const handleCursorUpdate = (data: {
      user_id: string;
      user_name: string;
      cursor: any;
      page_id: string;
    }) => {
      if (data.page_id === pageUuid && presenceMapRef.current) {
        const current = presenceMapRef.current.get(data.user_id) || {};
        presenceMapRef.current.set(data.user_id, {
          ...current,
          cursor: data.cursor,
          last_seen: new Date().toISOString(),
        });
      }
    };

    on('user_joined', handleUserJoined);
    on('user_left', handleUserLeft);
    on('presence_update', handlePresenceUpdate);
    on('cursor_update', handleCursorUpdate);

    return () => {
      off('user_joined', handleUserJoined);
      off('user_left', handleUserLeft);
      off('presence_update', handlePresenceUpdate);
      off('cursor_update', handleCursorUpdate);
    };
  }, [socket, pageUuid, on, off]);

  // Update cursor position (throttled)
  const updateCursor = useCallback(
    (cursor: { x: number; y: number; block_uuid?: string }) => {
      if (!isConnected || !user) {
        return;
      }

      // Throttle cursor updates (max once per 100ms)
      if (cursorUpdateTimeoutRef.current) {
        clearTimeout(cursorUpdateTimeoutRef.current);
      }

      cursorUpdateTimeoutRef.current = setTimeout(() => {
        emit('cursor_update', {
          page_id: pageUuid,
          cursor,
        });

        // Update local presence map
        if (presenceMapRef.current) {
          const current = presenceMapRef.current.get(user.id) || {};
          presenceMapRef.current.set(user.id, {
            ...current,
            user_id: user.id,
            user_name: user.name || user.email,
            user_email: user.email,
            cursor,
            last_seen: new Date().toISOString(),
          });
        }
      }, 100);
    },
    [isConnected, user, pageUuid, emit]
  );

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (cursorUpdateTimeoutRef.current) {
        clearTimeout(cursorUpdateTimeoutRef.current);
      }
    };
  }, []);

  return {
    presence,
    updateCursor,
    isConnected,
  };
}

