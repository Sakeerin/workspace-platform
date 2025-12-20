import { Server, Socket } from 'socket.io';
import { RoomManager } from '../room.manager';

/**
 * Page Handler
 * 
 * Handles page-level events like title updates, metadata changes, etc.
 */
export class PageHandler {
  private server: Server;
  private roomManager: RoomManager;

  constructor(server: Server, roomManager: RoomManager) {
    this.server = server;
    this.roomManager = roomManager;
  }

  /**
   * Handle page update from client
   */
  handlePageUpdate(client: Socket, data: { page_id: string; page: any }) {
    if (!client.data.user) {
      return;
    }

    const { page_id, page } = data;
    const userId = client.data.user.userId;

    // Broadcast to other clients (excluding sender)
    client.to(`page:${page_id}`).emit('page_updated', {
      page: {
        ...page,
        last_edited_by: userId,
        updated_at: new Date().toISOString(),
      },
      page_id,
      user_id: userId,
    });
  }

  /**
   * Broadcast page update (called from PageService)
   */
  broadcastUpdate(pageUuid: string, page: any) {
    this.roomManager.broadcastToPage(pageUuid, 'page_updated', {
      page,
      page_id: pageUuid,
    });
  }
}

