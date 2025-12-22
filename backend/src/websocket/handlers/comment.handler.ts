import { Server, Socket } from 'socket.io';
import { RoomManager } from '../room.manager';
import { CommentService } from '../../services/comment.service';

/**
 * Comment Handler
 * 
 * Handles real-time comment updates, creation, and deletion
 */
export class CommentHandler {
  private server: Server;
  private roomManager: RoomManager;
  private commentService: CommentService;

  constructor(server: Server, roomManager: RoomManager, commentService: CommentService) {
    this.server = server;
    this.roomManager = roomManager;
    this.commentService = commentService;
  }

  /**
   * Handle comment creation
   */
  handleCommentCreate(client: Socket, data: { page_id: string; comment: any }) {
    if (!client.data.user) {
      return;
    }

    const { page_id, comment } = data;
    const userId = client.data.user.userId;

    // Broadcast to other clients in the page room (excluding sender)
    client.to(`page:${page_id}`).emit('comment_created', {
      comment: {
        ...comment,
        created_by: userId,
        created_at: new Date().toISOString(),
      },
      page_id,
      user_id: userId,
    });
  }

  /**
   * Handle comment update
   */
  handleCommentUpdate(client: Socket, data: { page_id: string; comment: any }) {
    if (!client.data.user) {
      return;
    }

    const { page_id, comment } = data;
    const userId = client.data.user.userId;

    // Broadcast to other clients in the page room (excluding sender)
    client.to(`page:${page_id}`).emit('comment_updated', {
      comment: {
        ...comment,
        last_edited_by: userId,
        updated_at: new Date().toISOString(),
      },
      page_id,
      user_id: userId,
    });
  }

  /**
   * Handle comment deletion
   */
  handleCommentDelete(client: Socket, data: { page_id: string; comment_uuid: string }) {
    if (!client.data.user) {
      return;
    }

    const { page_id, comment_uuid } = data;
    const userId = client.data.user.userId;

    // Broadcast to other clients in the page room (excluding sender)
    client.to(`page:${page_id}`).emit('comment_deleted', {
      comment_uuid,
      page_id,
      user_id: userId,
    });
  }

  /**
   * Handle comment resolution
   */
  handleCommentResolve(client: Socket, data: { page_id: string; comment_uuid: string; resolved: boolean }) {
    if (!client.data.user) {
      return;
    }

    const { page_id, comment_uuid, resolved } = data;
    const userId = client.data.user.userId;

    // Broadcast to other clients in the page room (excluding sender)
    client.to(`page:${page_id}`).emit('comment_resolved', {
      comment_uuid,
      resolved,
      page_id,
      user_id: userId,
    });
  }

  /**
   * Register comment event handlers
   */
  registerHandlers(client: Socket) {
    client.on('comment:create', (data) => this.handleCommentCreate(client, data));
    client.on('comment:update', (data) => this.handleCommentUpdate(client, data));
    client.on('comment:delete', (data) => this.handleCommentDelete(client, data));
    client.on('comment:resolve', (data) => this.handleCommentResolve(client, data));
  }
}

