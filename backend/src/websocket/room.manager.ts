import { Server, Socket } from 'socket.io';
import { Redis } from 'ioredis';
import redis from '../config/redis';

/**
 * Room Manager
 * 
 * Manages WebSocket rooms for pages and workspaces.
 * Uses Redis to track room membership across multiple server instances.
 */
export class RoomManager {
  private server: Server;
  private redisClient: Redis;
  private roomPrefix = 'room:';

  constructor(server: Server) {
    this.server = server;
    this.redisClient = redis;
  }

  /**
   * Join a page room
   */
  async joinPageRoom(client: Socket, pageUuid: string) {
    const roomName = `page:${pageUuid}`;
    await client.join(roomName);
    
    // Track in Redis for cross-server awareness
    const key = `${this.roomPrefix}${roomName}`;
    await this.redisClient.sadd(key, client.id);
    await this.redisClient.expire(key, 3600); // 1 hour expiry
  }

  /**
   * Leave a page room
   */
  async leavePageRoom(client: Socket, pageUuid: string) {
    const roomName = `page:${pageUuid}`;
    await client.leave(roomName);
    
    // Remove from Redis
    const key = `${this.roomPrefix}${roomName}`;
    await this.redisClient.srem(key, client.id);
  }

  /**
   * Join a workspace room
   */
  async joinWorkspaceRoom(client: Socket, workspaceUuid: string) {
    const roomName = `workspace:${workspaceUuid}`;
    await client.join(roomName);
    
    const key = `${this.roomPrefix}${roomName}`;
    await this.redisClient.sadd(key, client.id);
    await this.redisClient.expire(key, 3600);
  }

  /**
   * Leave a workspace room
   */
  async leaveWorkspaceRoom(client: Socket, workspaceUuid: string) {
    const roomName = `workspace:${workspaceUuid}`;
    await client.leave(roomName);
    
    const key = `${this.roomPrefix}${roomName}`;
    await this.redisClient.srem(key, client.id);
  }

  /**
   * Get all clients in a page room
   */
  async getPageRoomClients(pageUuid: string): Promise<string[]> {
    const roomName = `page:${pageUuid}`;
    const key = `${this.roomPrefix}${roomName}`;
    return await this.redisClient.smembers(key);
  }

  /**
   * Broadcast to all clients in a page room
   */
  broadcastToPage(pageUuid: string, event: string, data: any) {
    const roomName = `page:${pageUuid}`;
    this.server.to(roomName).emit(event, data);
  }

  /**
   * Broadcast to all clients in a workspace room
   */
  broadcastToWorkspace(workspaceUuid: string, event: string, data: any) {
    const roomName = `workspace:${workspaceUuid}`;
    this.server.to(roomName).emit(event, data);
  }

  /**
   * Clean up room when empty
   */
  async cleanupRoom(roomName: string) {
    const key = `${this.roomPrefix}${roomName}`;
    const count = await this.redisClient.scard(key);
    
    if (count === 0) {
      await this.redisClient.del(key);
    }
  }
}

