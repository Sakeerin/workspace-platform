import { Server, Socket } from 'socket.io';
import { WebSocketGateway } from '../websocket/gateway';
import { RoomManager } from '../websocket/room.manager';
import { PresenceHandler } from '../websocket/handlers/presence.handler';
import { BlockHandler } from '../websocket/handlers/block.handler';
import { PageHandler } from '../websocket/handlers/page.handler';

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

  constructor(server: Server) {
    this.gateway = new WebSocketGateway(server);
    this.roomManager = new RoomManager(server);
    this.presenceHandler = new PresenceHandler(server, this.roomManager);
    this.blockHandler = new BlockHandler(server, this.roomManager);
    this.pageHandler = new PageHandler(server, this.roomManager);

    this.setupEventHandlers(server);
  }

  /**
   * Setup WebSocket event handlers
   */
  private setupEventHandlers(server: Server) {
    server.on('connection', (client: Socket) => {
      // Handle presence events
      client.on('join_page', (data: { page_id: string }) => {
        this.presenceHandler.handleJoinPage(client, data);
      });

      client.on('leave_page', (data: { page_id: string }) => {
        this.presenceHandler.handleLeavePage(client, data);
      });

      client.on('cursor_update', (data: { page_id: string; cursor: any }) => {
        this.presenceHandler.handleCursorUpdate(client, data);
      });

      // Handle block events
      client.on('block_update', (data: { page_id: string; block: any }) => {
        this.blockHandler.handleBlockUpdate(client, data);
      });

      client.on('block_create', (data: { page_id: string; block: any }) => {
        this.blockHandler.handleBlockCreate(client, data);
      });

      client.on('block_delete', (data: { page_id: string; block_uuid: string }) => {
        this.blockHandler.handleBlockDelete(client, data);
      });

      // Handle page events
      client.on('page_update', (data: { page_id: string; page: any }) => {
        this.pageHandler.handlePageUpdate(client, data);
      });

      // Handle disconnection
      client.on('disconnect', () => {
        this.presenceHandler.handleDisconnect(client);
      });
    });
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

