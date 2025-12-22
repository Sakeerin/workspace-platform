import { PrismaClient, Notification } from '@prisma/client';
import { UserRepository } from '../repositories/user.repository';
import { WorkspaceRepository } from '../repositories/workspace.repository';
import { PageRepository } from '../repositories/page.repository';
import prisma from '../config/database';

export type NotificationType = 'mention' | 'comment' | 'reply' | 'page_shared' | 'workspace_invite';

export interface CreateNotificationInput {
  userId: bigint;
  workspaceId: bigint;
  type: NotificationType;
  title: string;
  message?: string;
  data?: Record<string, any>;
  pageId?: bigint;
  triggeredById?: bigint;
}

export class NotificationService {
  private prisma: PrismaClient;

  constructor(
    private userRepo: UserRepository,
    private workspaceRepo: WorkspaceRepository,
    private pageRepo: PageRepository
  ) {
    this.prisma = prisma;
  }

  async createNotification(input: CreateNotificationInput): Promise<Notification> {
    return this.prisma.notification.create({
      data: {
        userId: input.userId,
        workspaceId: input.workspaceId,
        type: input.type,
        title: input.title,
        message: input.message,
        data: input.data || {},
        pageId: input.pageId,
        triggeredById: input.triggeredById,
      },
    });
  }

  async createMentionNotifications(
    mentionedUserIds: string[],
    workspaceId: bigint,
    pageId: bigint,
    commentId: string,
    triggeredById: bigint
  ): Promise<Notification[]> {
    const notifications: Notification[] = [];

    for (const userUuid of mentionedUserIds) {
      const user = await this.userRepo.findByUuid(userUuid);
      if (!user) {
        continue; // Skip invalid mentions
      }

      // Check if user is in the workspace
      // In production, you'd check workspace membership
      // For now, we'll create the notification

      const page = await this.pageRepo.findById(pageId);
      const triggeredBy = await this.userRepo.findById(triggeredById);

      const notification = await this.createNotification({
        userId: user.id,
        workspaceId,
        type: 'mention',
        title: `${triggeredBy?.name || 'Someone'} mentioned you`,
        message: `You were mentioned in a comment on "${page?.title || 'Untitled'}"`,
        data: {
          commentId,
          pageId: page?.uuid,
          pageTitle: page?.title,
        },
        pageId,
        triggeredById,
      });

      notifications.push(notification);
    }

    return notifications;
  }

  async createCommentNotification(
    pageId: bigint,
    commentId: string,
    triggeredById: bigint,
    parentCommentId?: string
  ): Promise<Notification | null> {
    const page = await this.pageRepo.findById(pageId);
    if (!page) {
      return null;
    }

    // If it's a reply, notify the parent comment author
    if (parentCommentId) {
      // Get parent comment to find its author
      const parentComment = await this.prisma.comment.findUnique({
        where: { uuid: parentCommentId },
        include: { user: true },
      });

      if (parentComment && parentComment.userId !== triggeredById) {
        const triggeredBy = await this.userRepo.findById(triggeredById);
        
        return this.createNotification({
          userId: parentComment.userId,
          workspaceId: page.workspaceId,
          type: 'reply',
          title: `${triggeredBy?.name || 'Someone'} replied to your comment`,
          message: `New reply on "${page.title}"`,
          data: {
            commentId,
            pageId: page.uuid,
            pageTitle: page.title,
            parentCommentId,
          },
          pageId,
          triggeredById,
        });
      }
    }

    // For top-level comments, notify page author (if different from comment author)
    if (page.createdById !== triggeredById) {
      const triggeredBy = await this.userRepo.findById(triggeredById);
      
      return this.createNotification({
        userId: page.createdById,
        workspaceId: page.workspaceId,
        type: 'comment',
        title: `${triggeredBy?.name || 'Someone'} commented on your page`,
        message: `New comment on "${page.title}"`,
        data: {
          commentId,
          pageId: page.uuid,
          pageTitle: page.title,
        },
        pageId,
        triggeredById,
      });
    }

    return null;
  }

  async getNotifications(userId: bigint, workspaceId?: bigint, unreadOnly: boolean = false) {
    return this.prisma.notification.findMany({
      where: {
        userId,
        workspaceId: workspaceId || undefined,
        isRead: unreadOnly ? false : undefined,
      },
      include: {
        page: {
          select: {
            uuid: true,
            title: true,
          },
        },
        triggeredBy: {
          select: {
            uuid: true,
            name: true,
            email: true,
            avatarUrl: true,
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
      take: 50, // Limit to 50 most recent
    });
  }

  async markAsRead(notificationUuid: string, userId: bigint): Promise<Notification> {
    return this.prisma.notification.update({
      where: {
        uuid: notificationUuid,
        userId, // Ensure user can only mark their own notifications as read
      },
      data: {
        isRead: true,
        readAt: new Date(),
      },
    });
  }

  async markAllAsRead(userId: bigint, workspaceId?: bigint): Promise<number> {
    const result = await this.prisma.notification.updateMany({
      where: {
        userId,
        workspaceId: workspaceId || undefined,
        isRead: false,
      },
      data: {
        isRead: true,
        readAt: new Date(),
      },
    });

    return result.count;
  }

  async getUnreadCount(userId: bigint, workspaceId?: bigint): Promise<number> {
    return this.prisma.notification.count({
      where: {
        userId,
        workspaceId: workspaceId || undefined,
        isRead: false,
      },
    });
  }
}

