import { useEffect, useRef, useState, useCallback } from 'react';
import { io, Socket } from 'socket.io-client';
import { env } from '../config/env';
import { useAuthStore } from '../store/auth';

interface UseWebSocketOptions {
  pageUuid?: string;
  autoConnect?: boolean;
}

interface UseWebSocketReturn {
  socket: Socket | null;
  isConnected: boolean;
  connect: () => void;
  disconnect: () => void;
  emit: (event: string, data: any) => void;
  on: (event: string, callback: (data: any) => void) => void;
  off: (event: string, callback?: (data: any) => void) => void;
}

/**
 * Hook for managing WebSocket connection
 */
export function useWebSocket(options: UseWebSocketOptions = {}): UseWebSocketReturn {
  const { pageUuid, autoConnect = true } = options;
  const { accessToken } = useAuthStore();
  const socketRef = useRef<Socket | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const listenersRef = useRef<Map<string, Set<(data: any) => void>>>(new Map());

  const connect = useCallback(() => {
    if (socketRef.current?.connected || !accessToken) {
      return;
    }

    const socket = io(env.wsUrl, {
      auth: {
        token: accessToken,
      },
      transports: ['websocket', 'polling'],
      reconnection: true,
      reconnectionDelay: 1000,
      reconnectionAttempts: 5,
      reconnectionDelayMax: 5000,
    });

    socket.on('connect', () => {
      setIsConnected(true);
      console.log('WebSocket connected');

      // Re-register all listeners
      listenersRef.current.forEach((callbacks, event) => {
        callbacks.forEach((callback) => {
          socket.on(event, callback);
        });
      });

      // Join page room if pageUuid provided
      if (pageUuid) {
        socket.emit('join_page', { page_id: pageUuid });
      }
    });

    socket.on('disconnect', () => {
      setIsConnected(false);
      console.log('WebSocket disconnected');
    });

    socket.on('connect_error', (error) => {
      console.error('WebSocket connection error:', error);
      setIsConnected(false);
    });

    socket.on('reconnect', (attemptNumber) => {
      console.log(`WebSocket reconnected after ${attemptNumber} attempts`);
      setIsConnected(true);

      // Rejoin page room
      if (pageUuid) {
        socket.emit('join_page', { page_id: pageUuid });
      }
    });

    socketRef.current = socket;
  }, [accessToken, pageUuid]);

  const disconnect = useCallback(() => {
    if (socketRef.current) {
      if (pageUuid) {
        socketRef.current.emit('leave_page', { page_id: pageUuid });
      }
      socketRef.current.disconnect();
      socketRef.current = null;
      setIsConnected(false);
    }
  }, [pageUuid]);

  const emit = useCallback((event: string, data: any) => {
    if (socketRef.current?.connected) {
      socketRef.current.emit(event, data);
    }
  }, []);

  const on = useCallback((event: string, callback: (data: any) => void) => {
    if (!listenersRef.current.has(event)) {
      listenersRef.current.set(event, new Set());
    }
    listenersRef.current.get(event)!.add(callback);

    if (socketRef.current) {
      socketRef.current.on(event, callback);
    }
  }, []);

  const off = useCallback((event: string, callback?: (data: any) => void) => {
    if (callback) {
      listenersRef.current.get(event)?.delete(callback);
      socketRef.current?.off(event, callback);
    } else {
      listenersRef.current.delete(event);
      socketRef.current?.off(event);
    }
  }, []);

  useEffect(() => {
    if (autoConnect && accessToken) {
      connect();
    }

    return () => {
      disconnect();
      // Clean up all listeners
      listenersRef.current.clear();
    };
  }, [autoConnect, accessToken, connect, disconnect]);

  // Update page room when pageUuid changes
  useEffect(() => {
    if (socketRef.current?.connected && pageUuid) {
      socketRef.current.emit('join_page', { page_id: pageUuid });
    }

    return () => {
      if (socketRef.current?.connected && pageUuid) {
        socketRef.current.emit('leave_page', { page_id: pageUuid });
      }
    };
  }, [pageUuid]);

  return {
    socket: socketRef.current,
    isConnected,
    connect,
    disconnect,
    emit,
    on,
    off,
  };
}

