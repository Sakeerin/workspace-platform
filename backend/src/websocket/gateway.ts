import { Server, Socket } from 'socket.io';
import { JWTService } from '../utils/jwt';

export class WebSocketGateway {
  private connectedUsers = new Map<string, Socket>();

  constructor(private server: Server) {
    this.setupEventHandlers();
  }

  private setupEventHandlers() {
    this.server.on('connection', (client: Socket) => {
      this.handleConnection(client);

      client.on('join_page', (data: { page_id: string }) => {
        this.handleJoinPage(client, data);
      });

      client.on('leave_page', (data: { page_id: string }) => {
        this.handleLeavePage(client, data);
      });

      client.on('disconnect', () => {
        this.handleDisconnect(client);
      });
    });
  }

  private async handleConnection(client: Socket) {
    try {
      const token = client.handshake.auth.token;
      if (!token) {
        client.disconnect();
        return;
      }

      const payload = JWTService.verifyAccessToken(token);
      client.data.user = payload;
      this.connectedUsers.set(payload.userId, client);

      client.emit('authenticated', { user: payload });
    } catch (error) {
      client.disconnect();
    }
  }

  private handleDisconnect(client: Socket) {
    if (client.data.user) {
      this.connectedUsers.delete(client.data.user.userId);
    }
  }

  private handleJoinPage(client: Socket, data: { page_id: string }) {
    if (!client.data.user) {
      return;
    }

    client.join(`page:${data.page_id}`);
  }

  private handleLeavePage(client: Socket, data: { page_id: string }) {
    client.leave(`page:${data.page_id}`);
  }

  broadcastToPage(pageId: string, event: string, data: any) {
    this.server.to(`page:${pageId}`).emit(event, data);
  }

  broadcastToWorkspace(workspaceId: string, event: string, data: any) {
    this.server.to(`workspace:${workspaceId}`).emit(event, data);
  }
}

