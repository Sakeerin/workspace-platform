import { Comment } from '@prisma/client';

export type CommentModel = Comment;

export interface CommentCreateInput {
  pageId: bigint;
  blockId?: bigint;
  parentCommentId?: bigint;
  userId: bigint;
  content: string;
  mentions?: string[];
}

export interface CommentUpdateInput {
  content?: string;
  mentions?: string[];
}

export interface CommentResolveInput {
  resolvedById: bigint;
}

