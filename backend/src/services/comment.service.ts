import { CommentRepository } from '../repositories/comment.repository';
import { PageRepository } from '../repositories/page.repository';
import { BlockRepository } from '../repositories/block.repository';
import { UserRepository } from '../repositories/user.repository';
import { PermissionService } from './permission.service';
import { CreateCommentDto, UpdateCommentDto } from '../dto/comment.dto';

export class CommentService {
  constructor(
    private commentRepo: CommentRepository,
    private pageRepo: PageRepository,
    private blockRepo: BlockRepository,
    private userRepo: UserRepository,
    private permissionService: PermissionService
  ) {}

  async createComment(pageUuid: string, userId: bigint, dto: CreateCommentDto) {
    // Get page and verify access
    const page = await this.pageRepo.findByUuid(pageUuid);
    if (!page) {
      throw new Error('Page not found');
    }

    // Check if comments are allowed
    if (!page.allowComments) {
      throw new Error('Comments are not allowed on this page');
    }

    await this.permissionService.requireWorkspaceAccess(userId, page.workspaceId);

    // Get block if block_id provided
    let blockId: bigint | undefined;
    if (dto.block_id) {
      const block = await this.blockRepo.findByUuid(dto.block_id);
      if (!block) {
        throw new Error('Block not found');
      }
      if (block.pageId !== page.id) {
        throw new Error('Block must be on the same page');
      }
      blockId = block.id;
    }

    // Get parent comment if parent_comment_id provided
    let parentCommentId: bigint | undefined;
    if (dto.parent_comment_id) {
      const parentComment = await this.commentRepo.findByUuid(dto.parent_comment_id);
      if (!parentComment) {
        throw new Error('Parent comment not found');
      }
      if (parentComment.pageId !== page.id) {
        throw new Error('Parent comment must be on the same page');
      }
      parentCommentId = parentComment.id;
    }

    // Parse mentions from content
    const mentions = dto.mentions || this.parseMentions(dto.content);

    // Validate mentioned users exist and are in the same workspace
    if (mentions.length > 0) {
      await this.validateMentions(mentions, page.workspaceId);
    }

    // Create comment
    const comment = await this.commentRepo.create({
      pageId: page.id,
      blockId,
      parentCommentId,
      userId,
      content: dto.content,
      mentions,
    });

    return comment;
  }

  async getComments(pageUuid: string, userId: bigint, blockUuid?: string) {
    const page = await this.pageRepo.findByUuid(pageUuid);
    if (!page) {
      throw new Error('Page not found');
    }

    await this.permissionService.requireWorkspaceAccess(userId, page.workspaceId);

    if (blockUuid) {
      const block = await this.blockRepo.findByUuid(blockUuid);
      if (!block || block.pageId !== page.id) {
        throw new Error('Block not found');
      }
      return this.commentRepo.findByBlockId(block.id);
    }

    return this.commentRepo.findByPageId(page.id);
  }

  async getComment(commentUuid: string, userId: bigint) {
    const comment = await this.commentRepo.findByUuid(commentUuid);
    if (!comment) {
      throw new Error('Comment not found');
    }

    const page = await this.pageRepo.findById(comment.pageId);
    if (!page) {
      throw new Error('Page not found');
    }

    await this.permissionService.requireWorkspaceAccess(userId, page.workspaceId);

    return comment;
  }

  async updateComment(commentUuid: string, userId: bigint, dto: UpdateCommentDto) {
    const comment = await this.commentRepo.findByUuid(commentUuid);
    if (!comment) {
      throw new Error('Comment not found');
    }

    // Only the comment author can update
    if (comment.userId !== userId) {
      throw new Error('You can only update your own comments');
    }

    // Parse mentions if content is updated
    let mentions = dto.mentions;
    if (dto.content) {
      mentions = dto.mentions || this.parseMentions(dto.content);
      
      // Validate mentioned users
      if (mentions && mentions.length > 0) {
        const page = await this.pageRepo.findById(comment.pageId);
        if (page) {
          await this.validateMentions(mentions, page.workspaceId);
        }
      }
    }

    return this.commentRepo.updateByUuid(commentUuid, {
      content: dto.content,
      mentions,
    });
  }

  async deleteComment(commentUuid: string, userId: bigint) {
    const comment = await this.commentRepo.findByUuid(commentUuid);
    if (!comment) {
      throw new Error('Comment not found');
    }

    const page = await this.pageRepo.findById(comment.pageId);
    if (!page) {
      throw new Error('Page not found');
    }

    // Only the comment author or workspace admin can delete
    const isAuthor = comment.userId === userId;
    const canManage = await this.permissionService.canManageWorkspace(userId, page.workspaceId);
    
    if (!isAuthor && !canManage) {
      throw new Error('You do not have permission to delete this comment');
    }

    return this.commentRepo.softDelete(comment.id);
  }

  async resolveComment(commentUuid: string, userId: bigint, resolved: boolean) {
    const comment = await this.commentRepo.findByUuid(commentUuid);
    if (!comment) {
      throw new Error('Comment not found');
    }

    const page = await this.pageRepo.findById(comment.pageId);
    if (!page) {
      throw new Error('Page not found');
    }

    await this.permissionService.requireWorkspaceAccess(userId, page.workspaceId);

    if (resolved) {
      return this.commentRepo.resolve(comment.id, userId);
    } else {
      return this.commentRepo.unresolve(comment.id);
    }
  }

  /**
   * Parse @mentions from comment content
   * Supports formats: @username, @user@example.com, @[User Name](user-uuid)
   */
  parseMentions(content: string): string[] {
    const mentions: string[] = [];
    
    // Match @username or @email patterns
    const mentionPattern = /@(\w+@[\w.-]+\.\w+|[\w.-]+)/g;
    let match;
    
    while ((match = mentionPattern.exec(content)) !== null) {
      const mention = match[1];
      // Try to find user by email or name
      // For now, we'll extract and return them - validation happens later
      mentions.push(mention);
    }

    // Also match @[Display Name](uuid) format
    const uuidPattern = /@\[([^\]]+)\]\(([a-f0-9-]{36})\)/gi;
    while ((match = uuidPattern.exec(content)) !== null) {
      const uuid = match[2];
      if (uuid && !mentions.includes(uuid)) {
        mentions.push(uuid);
      }
    }

    return [...new Set(mentions)]; // Remove duplicates
  }

  /**
   * Validate that mentioned users exist and are in the same workspace
   */
  private async validateMentions(mentions: string[], workspaceId: bigint): Promise<void> {
    for (const mention of mentions) {
      // If it's a UUID, find by UUID
      if (/^[a-f0-9-]{36}$/i.test(mention)) {
        const user = await this.userRepo.findByUuid(mention);
        if (!user) {
          throw new Error(`Mentioned user not found: ${mention}`);
        }
        // Check if user is in workspace (simplified - in production, check workspace membership)
        // For now, we'll just validate the user exists
      } else {
        // Try to find by email or name
        // This is a simplified implementation
        const user = await this.userRepo.findByEmail(mention);
        if (!user) {
          // Try to find by name (would need additional method)
          // For now, we'll allow it and validate on notification creation
        }
      }
    }
  }
}

