import { Server, Socket } from 'socket.io';
import { WebSocketGateway } from '../websocket/gateway';
import { RoomManager } from '../websocket/room.manager';
import { PresenceHandler } from '../websocket/handlers/presence.handler';
import { BlockHandler } from '../websocket/handlers/block.handler';
import { PageHandler } from '../websocket/handlers/page.handler';
import { PageRepository } from '../repositories/page.repository';
import { UserRepository } from '../repositories/user.repository';
import { PermissionService } from './permission.service';

/**
 * WebSocket Service
 * 
 * Coordinates all WebSocket-related functionality including:
 * - Presence tracking
 * - Block updates
 * - Page events
 * - Room management
 */
export class WebSocketService {
  private gateway: WebSocketGateway;
  private roomManager: RoomManager;
  private presenceHandler: PresenceHandler;
  private blockHandler: BlockHandler;
  private pageHandler: PageHandler;

  constructor(
    server: Server,
    private pageRepo: PageRepository,
    private userRepo: UserRepository,
    private permissionService: PermissionService
  ) {
    this.gateway = new WebSocketGateway(server);
    this.roomManager = new RoomManager(server);
    const pageAccessGuard = this.canAccessPage.bind(this);
    this.presenceHandler = new PresenceHandler(server, this.roomManager, pageAccessGuard);
    this.blockHandler = new BlockHandler(server, this.roomManager, pageAccessGuard);
    this.pageHandler = new PageHandler(server, this.roomManager, pageAccessGuard);

    this.setupEventHandlers(server);
  }

  /**
   * Setup WebSocket event handlers
   */
  private setupEventHandlers(server: Server) {
    server.on('connection', (client: Socket) => {
      // Handle presence events
      client.on('join_page', async (data: { page_id: string }) => {
        await this.presenceHandler.handleJoinPage(client, data);
      });

      client.on('leave_page', async (data: { page_id: string }) => {
        await this.presenceHandler.handleLeavePage(client, data);
      });

      client.on('cursor_update', async (data: { page_id: string; cursor: any }) => {
        await this.presenceHandler.handleCursorUpdate(client, data);
      });

      // Handle block events
      client.on('block_update', async (data: { page_id: string; block: any }) => {
        await this.blockHandler.handleBlockUpdate(client, data);
      });

      client.on('block_create', async (data: { page_id: string; block: any }) => {
        await this.blockHandler.handleBlockCreate(client, data);
      });

      client.on('block_delete', async (data: { page_id: string; block_uuid: string }) => {
        await this.blockHandler.handleBlockDelete(client, data);
      });

      // Handle page events
      client.on('page_update', async (data: { page_id: string; page: any }) => {
        await this.pageHandler.handlePageUpdate(client, data);
      });

      // Handle disconnection
      client.on('disconnect', () => {
        this.presenceHandler.handleDisconnect(client);
      });
    });
  }

  private async canAccessPage(client: Socket, pageUuid: string): Promise<boolean> {
    const userUuid = client.data.user?.userId;
    if (!userUuid || !pageUuid) {
      return false;
    }

    const [user, page] = await Promise.all([
      this.userRepo.findByUuid(userUuid),
      this.pageRepo.findByUuid(pageUuid),
    ]);

    if (!user || !page || page.deletedAt) {
      return false;
    }

    return this.permissionService.canAccessWorkspace(user.id, page.workspaceId);
  }

  /**
   * Broadcast block update to all clients on a page
   */
  broadcastBlockUpdate(pageUuid: string, block: any) {
    this.blockHandler.broadcastUpdate(pageUuid, block);
  }

  /**
   * Broadcast block creation to all clients on a page
   */
  broadcastBlockCreate(pageUuid: string, block: any) {
    this.blockHandler.broadcastCreate(pageUuid, block);
  }

  /**
   * Broadcast block deletion to all clients on a page
   */
  broadcastBlockDelete(pageUuid: string, blockUuid: string) {
    this.blockHandler.broadcastDelete(pageUuid, blockUuid);
  }

  /**
   * Get presence information for a page
   */
  getPresence(pageUuid: string): Map<string, import('../websocket/handlers/presence.handler').PresenceData> {
    return this.presenceHandler.getPresence(pageUuid);
  }
}

