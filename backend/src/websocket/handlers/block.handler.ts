import { Server, Socket } from 'socket.io';
import { RoomManager } from '../room.manager';
import { YjsSetup } from '../crdt/yjs-setup';

/**
 * Block Handler
 * 
 * Handles real-time block updates, creation, and deletion
 * using Yjs CRDT for conflict resolution.
 */
export class BlockHandler {
  private server: Server;
  private roomManager: RoomManager;

  constructor(server: Server, roomManager: RoomManager) {
    this.server = server;
    this.roomManager = roomManager;
  }

  /**
   * Handle block update from client
   */
  handleBlockUpdate(client: Socket, data: { page_id: string; block: any }) {
    if (!client.data.user) {
      return;
    }

    const { page_id, block } = data;
    const userId = client.data.user.userId;

    // Update Yjs document
    const blocksMap = YjsSetup.getBlocksMap(page_id);
    blocksMap.set(block.uuid, {
      ...block,
      last_edited_by: userId,
      updated_at: new Date().toISOString(),
    });

    // Broadcast to other clients (excluding sender)
    client.to(`page:${page_id}`).emit('block_updated', {
      block: {
        ...block,
        last_edited_by: userId,
        updated_at: new Date().toISOString(),
      },
      page_id,
      user_id: userId,
    });
  }

  /**
   * Handle block creation from client
   */
  handleBlockCreate(client: Socket, data: { page_id: string; block: any }) {
    if (!client.data.user) {
      return;
    }

    const { page_id, block } = data;
    const userId = client.data.user.userId;

    // Add to Yjs document
    const blocksMap = YjsSetup.getBlocksMap(page_id);
    blocksMap.set(block.uuid, {
      ...block,
      created_by: userId,
      last_edited_by: userId,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    });

    // Broadcast to other clients (excluding sender)
    client.to(`page:${page_id}`).emit('block_created', {
      block: {
        ...block,
        created_by: userId,
        last_edited_by: userId,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      },
      page_id,
      user_id: userId,
    });
  }

  /**
   * Handle block deletion from client
   */
  handleBlockDelete(client: Socket, data: { page_id: string; block_uuid: string }) {
    if (!client.data.user) {
      return;
    }

    const { page_id, block_uuid } = data;
    const userId = client.data.user.userId;

    // Remove from Yjs document
    const blocksMap = YjsSetup.getBlocksMap(page_id);
    blocksMap.delete(block_uuid);

    // Broadcast to other clients (excluding sender)
    client.to(`page:${page_id}`).emit('block_deleted', {
      block_uuid,
      page_id,
      user_id: userId,
    });
  }

  /**
   * Broadcast block update (called from BlockService)
   */
  broadcastUpdate(pageUuid: string, block: any) {
    this.roomManager.broadcastToPage(pageUuid, 'block_updated', {
      block,
      page_id: pageUuid,
    });
  }

  /**
   * Broadcast block creation (called from BlockService)
   */
  broadcastCreate(pageUuid: string, block: any) {
    this.roomManager.broadcastToPage(pageUuid, 'block_created', {
      block,
      page_id: pageUuid,
    });
  }

  /**
   * Broadcast block deletion (called from BlockService)
   */
  broadcastDelete(pageUuid: string, blockUuid: string) {
    this.roomManager.broadcastToPage(pageUuid, 'block_deleted', {
      block_uuid: blockUuid,
      page_id: pageUuid,
    });
  }
}

