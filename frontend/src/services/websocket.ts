import { io, Socket } from 'socket.io-client';
import { env } from '../config/env';

class WebSocketService {
  private socket: Socket | null = null;
  private listeners: Map<string, Set<(data: any) => void>> = new Map();

  private pendingUpdates: Array<{ event: string; data: any }> = [];
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 10;

  connect(token: string): void {
    if (this.socket?.connected) {
      return;
    }

    this.socket = io(env.wsUrl, {
      auth: {
        token,
      },
      transports: ['websocket', 'polling'],
      reconnection: true,
      reconnectionDelay: 1000,
      reconnectionDelayMax: 5000,
      reconnectionAttempts: this.maxReconnectAttempts,
      timeout: 20000,
    });

    this.socket.on('connect', () => {
      console.log('WebSocket connected');
      this.reconnectAttempts = 0;

      // Re-register existing listeners
      this.listeners.forEach((callbacks, event) => {
        callbacks.forEach((callback) => {
          this.socket?.on(event, callback);
        });
      });

      // Send pending updates
      this.flushPendingUpdates();
    });

    this.socket.on('disconnect', (reason) => {
      console.log('WebSocket disconnected:', reason);
      
      // If disconnect was not intentional, attempt reconnection
      if (reason === 'io server disconnect') {
        // Server disconnected, reconnect manually
        setTimeout(() => {
          if (this.reconnectAttempts < this.maxReconnectAttempts) {
            this.reconnectAttempts++;
            this.socket?.connect();
          }
        }, 1000);
      }
    });

    this.socket.on('reconnect', (attemptNumber) => {
      console.log(`WebSocket reconnected after ${attemptNumber} attempts`);
      this.reconnectAttempts = 0;
      this.flushPendingUpdates();
    });

    this.socket.on('reconnect_attempt', (attemptNumber) => {
      console.log(`WebSocket reconnection attempt ${attemptNumber}`);
    });

    this.socket.on('reconnect_error', (error) => {
      console.error('WebSocket reconnection error:', error);
    });

    this.socket.on('reconnect_failed', () => {
      console.error('WebSocket reconnection failed after all attempts');
    });

    this.socket.on('error', (error) => {
      console.error('WebSocket error:', error);
    });
  }

  private flushPendingUpdates() {
    while (this.pendingUpdates.length > 0) {
      const update = this.pendingUpdates.shift();
      if (update && this.socket?.connected) {
        this.socket.emit(update.event, update.data);
      }
    }
  }

  disconnect(): void {
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
    }
  }

  on(event: string, callback: (data: any) => void): void {
    if (!this.listeners.has(event)) {
      this.listeners.set(event, new Set());
    }
    this.listeners.get(event)?.add(callback);

    if (this.socket) {
      this.socket.on(event, callback);
    }
  }

  off(event: string, callback?: (data: any) => void): void {
    if (callback) {
      this.listeners.get(event)?.delete(callback);
      this.socket?.off(event, callback);
    } else {
      this.listeners.delete(event);
      this.socket?.off(event);
    }
  }

  emit(event: string, data: any): void {
    if (this.socket?.connected) {
      this.socket.emit(event, data);
    } else {
      // Queue update for when connection is restored
      this.pendingUpdates.push({ event, data });
      
      // Try to reconnect if not already attempting
      if (!this.socket || !this.socket.connected) {
        // Connection will be restored by reconnection logic
      }
    }
  }

  isConnected(): boolean {
    return this.socket?.connected || false;
  }
}

export const websocket = new WebSocketService();
export default websocket;

