import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  Request,
  UseGuards,
  HttpCode,
  HttpStatus,
  Query,
} from '@nestjs/common';
import { CommentService } from '../services/comment.service';
import { NotificationService } from '../services/notification.service';
import { UserRepository } from '../repositories/user.repository';
import { CreateCommentDto, UpdateCommentDto, ResolveCommentDto } from '../dto/comment.dto';
import { JwtAuthGuard } from '../guards/jwt-auth.guard';

@Controller('pages/:pageUuid/comments')
@UseGuards(JwtAuthGuard)
export class CommentController {
  constructor(
    private readonly commentService: CommentService,
    private readonly notificationService: NotificationService,
    private readonly userRepo: UserRepository
  ) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  async createComment(
    @Param('pageUuid') pageUuid: string,
    @Request() req: any,
    @Body() dto: CreateCommentDto
  ) {
    const userUuid = req.user.userId;
    const user = await this.userRepo.findByUuid(userUuid);
    if (!user) {
      throw new Error('User not found');
    }

    const comment = await this.commentService.createComment(pageUuid, user.id, dto);

    // Get page for notifications
    const pageRepo = (this.commentService as any).pageRepo;
    const page = await pageRepo.findByUuid(pageUuid);
    
    // Create notifications for mentions
    if (page && comment.mentions && Array.isArray(comment.mentions) && comment.mentions.length > 0) {
      await this.notificationService.createMentionNotifications(
        comment.mentions as string[],
        page.workspaceId,
        page.id,
        comment.uuid,
        user.id
      );
    }

    // Create notification for comment/reply
    if (page) {
      await this.notificationService.createCommentNotification(
        page.id,
        comment.uuid,
        user.id,
        dto.parent_comment_id
      );
    }

    return {
      success: true,
      data: comment,
    };
  }

  @Get()
  async getComments(
    @Param('pageUuid') pageUuid: string,
    @Request() req: any,
    @Query('block_id') blockId?: string
  ) {
    const userUuid = req.user.userId;
    const user = await this.userRepo.findByUuid(userUuid);
    if (!user) {
      throw new Error('User not found');
    }

    const comments = await this.commentService.getComments(pageUuid, user.id, blockId);
    return {
      success: true,
      data: comments,
    };
  }

  @Get(':commentUuid')
  async getComment(
    @Param('pageUuid') pageUuid: string,
    @Param('commentUuid') commentUuid: string,
    @Request() req: any
  ) {
    const userUuid = req.user.userId;
    const user = await this.userRepo.findByUuid(userUuid);
    if (!user) {
      throw new Error('User not found');
    }

    const comment = await this.commentService.getComment(commentUuid, user.id);
    return {
      success: true,
      data: comment,
    };
  }

  @Put(':commentUuid')
  async updateComment(
    @Param('pageUuid') pageUuid: string,
    @Param('commentUuid') commentUuid: string,
    @Request() req: any,
    @Body() dto: UpdateCommentDto
  ) {
    const userUuid = req.user.userId;
    const user = await this.userRepo.findByUuid(userUuid);
    if (!user) {
      throw new Error('User not found');
    }

    const comment = await this.commentService.updateComment(commentUuid, user.id, dto);

    // Create notifications for new mentions
    if (dto.content && comment.mentions && Array.isArray(comment.mentions) && comment.mentions.length > 0) {
      const pageRepo = (this.commentService as any).pageRepo;
      const page = await pageRepo.findByUuid(pageUuid);
      if (page) {
        await this.notificationService.createMentionNotifications(
          comment.mentions as string[],
          page.workspaceId,
          page.id,
          comment.uuid,
          user.id
        );
      }
    }

    return {
      success: true,
      data: comment,
    };
  }

  @Delete(':commentUuid')
  @HttpCode(HttpStatus.NO_CONTENT)
  async deleteComment(
    @Param('pageUuid') pageUuid: string,
    @Param('commentUuid') commentUuid: string,
    @Request() req: any
  ) {
    const userUuid = req.user.userId;
    const user = await this.userRepo.findByUuid(userUuid);
    if (!user) {
      throw new Error('User not found');
    }

    await this.commentService.deleteComment(commentUuid, user.id);
  }

  @Post(':commentUuid/resolve')
  async resolveComment(
    @Param('pageUuid') pageUuid: string,
    @Param('commentUuid') commentUuid: string,
    @Request() req: any,
    @Body() dto: ResolveCommentDto
  ) {
    const userUuid = req.user.userId;
    const user = await this.userRepo.findByUuid(userUuid);
    if (!user) {
      throw new Error('User not found');
    }

    const comment = await this.commentService.resolveComment(
      commentUuid,
      user.id,
      dto.resolved !== false
    );

    return {
      success: true,
      data: comment,
    };
  }
}

