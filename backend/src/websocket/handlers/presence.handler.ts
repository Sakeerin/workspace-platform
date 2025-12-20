import { Server, Socket } from 'socket.io';
import { RoomManager } from '../room.manager';
import { YjsSetup } from '../crdt/yjs-setup';

interface PresenceData {
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

/**
 * Presence Handler
 * 
 * Manages user presence tracking (who's viewing/editing a page)
 * and cursor positions for live collaboration.
 */
export class PresenceHandler {
  private server: Server;
  private roomManager: RoomManager;
  private presence = new Map<string, Map<string, PresenceData>>(); // pageUuid -> userId -> presence

  constructor(server: Server, roomManager: RoomManager) {
    this.server = server;
    this.roomManager = roomManager;
  }

  /**
   * Handle user joining a page
   */
  async handleJoinPage(client: Socket, data: { page_id: string }) {
    if (!client.data.user) {
      return;
    }

    const { page_id } = data;
    const userId = client.data.user.userId;
    const userName = client.data.user.name || client.data.user.email;
    const userEmail = client.data.user.email;

    // Join room
    await this.roomManager.joinPageRoom(client, page_id);

    // Add presence
    if (!this.presence.has(page_id)) {
      this.presence.set(page_id, new Map());
    }

    const presenceData: PresenceData = {
      user_id: userId,
      user_name: userName,
      user_email: userEmail,
      last_seen: new Date().toISOString(),
    };

    this.presence.get(page_id)!.set(userId, presenceData);

    // Update Yjs presence map
    const presenceMap = YjsSetup.getPresenceMap(page_id);
    presenceMap.set(userId, presenceData);

    // Broadcast to other users on the page
    this.roomManager.broadcastToPage(page_id, 'user_joined', {
      user: {
        id: userId,
        name: userName,
        email: userEmail,
      },
      page_id,
    });

    // Send current presence to the new user
    const currentPresence = this.getPresence(page_id);
    client.emit('presence_update', {
      users: Array.from(currentPresence.values()),
      page_id,
    });
  }

  /**
   * Handle user leaving a page
   */
  async handleLeavePage(client: Socket, data: { page_id: string }) {
    if (!client.data.user) {
      return;
    }

    const { page_id } = data;
    const userId = client.data.user.userId;

    // Leave room
    await this.roomManager.leavePageRoom(client, page_id);

    // Remove presence
    if (this.presence.has(page_id)) {
      this.presence.get(page_id)!.delete(userId);
      
      if (this.presence.get(page_id)!.size === 0) {
        this.presence.delete(page_id);
      }
    }

    // Update Yjs presence map
    const presenceMap = YjsSetup.getPresenceMap(page_id);
    presenceMap.delete(userId);

    // Broadcast to other users
    this.roomManager.broadcastToPage(page_id, 'user_left', {
      user: {
        id: userId,
        name: client.data.user.name || client.data.user.email,
      },
      page_id,
    });
  }

  /**
   * Handle cursor position update
   */
  handleCursorUpdate(client: Socket, data: { page_id: string; cursor: any }) {
    if (!client.data.user) {
      return;
    }

    const { page_id, cursor } = data;
    const userId = client.data.user.userId;

    // Update presence with cursor
    if (this.presence.has(page_id) && this.presence.get(page_id)!.has(userId)) {
      const presenceData = this.presence.get(page_id)!.get(userId)!;
      presenceData.cursor = cursor;
      presenceData.last_seen = new Date().toISOString();
    }

    // Update Yjs presence map
    const presenceMap = YjsSetup.getPresenceMap(page_id);
    const currentPresence = presenceMap.get(userId) || {};
    presenceMap.set(userId, {
      ...currentPresence,
      cursor,
      last_seen: new Date().toISOString(),
    });

    // Broadcast cursor update to other users
    this.roomManager.broadcastToPage(page_id, 'cursor_update', {
      user_id: userId,
      user_name: client.data.user.name || client.data.user.email,
      cursor,
      page_id,
    });
  }

  /**
   * Handle client disconnection
   */
  async handleDisconnect(client: Socket) {
    if (!client.data.user) {
      return;
    }

    const userId = client.data.user.userId;

    // Remove from all pages
    for (const [pageId, presenceMap] of this.presence.entries()) {
      if (presenceMap.has(userId)) {
        presenceMap.delete(userId);
        
        // Update Yjs
        const yjsPresenceMap = YjsSetup.getPresenceMap(pageId);
        yjsPresenceMap.delete(userId);

        // Broadcast leave
        this.roomManager.broadcastToPage(pageId, 'user_left', {
          user: {
            id: userId,
            name: client.data.user.name || client.data.user.email,
          },
          page_id: pageId,
        });

        // Cleanup if empty
        if (presenceMap.size === 0) {
          this.presence.delete(pageId);
        }
      }
    }
  }

  /**
   * Get presence information for a page
   */
  getPresence(pageUuid: string): Map<string, PresenceData> {
    return this.presence.get(pageUuid) || new Map();
  }
}

