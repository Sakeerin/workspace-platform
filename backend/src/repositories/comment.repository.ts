import { PrismaClient, Comment } from '@prisma/client';
import { BaseRepository } from './base.repository';
import { CommentCreateInput, CommentUpdateInput } from '../models/comment.model';
import prisma from '../config/database';

export class CommentRepository extends BaseRepository<Comment> {
  constructor() {
    super(prisma);
  }

  getModel() {
    return this.prisma.comment;
  }

  async findById(id: bigint): Promise<Comment | null> {
    return this.getModel().findUnique({
      where: { id },
      include: {
        user: {
          select: {
            uuid: true,
            name: true,
            email: true,
            avatarUrl: true,
          },
        },
        childComments: {
          where: { deletedAt: null },
          include: {
            user: {
              select: {
                uuid: true,
                name: true,
                email: true,
                avatarUrl: true,
              },
            },
          },
          orderBy: { createdAt: 'asc' },
        },
      },
    });
  }

  async findByUuid(uuid: string): Promise<Comment | null> {
    return this.getModel().findUnique({
      where: { uuid },
      include: {
        user: {
          select: {
            uuid: true,
            name: true,
            email: true,
            avatarUrl: true,
          },
        },
        childComments: {
          where: { deletedAt: null },
          include: {
            user: {
              select: {
                uuid: true,
                name: true,
                email: true,
                avatarUrl: true,
              },
            },
          },
          orderBy: { createdAt: 'asc' },
        },
      },
    });
  }

  async findByPageId(pageId: bigint): Promise<Comment[]> {
    return this.getModel().findMany({
      where: {
        pageId,
        parentCommentId: null, // Only top-level comments
        deletedAt: null,
      },
      include: {
        user: {
          select: {
            uuid: true,
            name: true,
            email: true,
            avatarUrl: true,
          },
        },
        childComments: {
          where: { deletedAt: null },
          include: {
            user: {
              select: {
                uuid: true,
                name: true,
                email: true,
                avatarUrl: true,
              },
            },
          },
          orderBy: { createdAt: 'asc' },
        },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async findByBlockId(blockId: bigint): Promise<Comment[]> {
    return this.getModel().findMany({
      where: {
        blockId,
        parentCommentId: null,
        deletedAt: null,
      },
      include: {
        user: {
          select: {
            uuid: true,
            name: true,
            email: true,
            avatarUrl: true,
          },
        },
        childComments: {
          where: { deletedAt: null },
          include: {
            user: {
              select: {
                uuid: true,
                name: true,
                email: true,
                avatarUrl: true,
              },
            },
          },
          orderBy: { createdAt: 'asc' },
        },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async findByParentCommentId(parentCommentId: bigint): Promise<Comment[]> {
    return this.getModel().findMany({
      where: {
        parentCommentId,
        deletedAt: null,
      },
      include: {
        user: {
          select: {
            uuid: true,
            name: true,
            email: true,
            avatarUrl: true,
          },
        },
      },
      orderBy: { createdAt: 'asc' },
    });
  }

  async create(data: CommentCreateInput): Promise<Comment> {
    return this.getModel().create({
      data: {
        ...data,
        mentions: data.mentions || [],
      },
      include: {
        user: {
          select: {
            uuid: true,
            name: true,
            email: true,
            avatarUrl: true,
          },
        },
      },
    });
  }

  async update(id: bigint, data: CommentUpdateInput): Promise<Comment> {
    return this.getModel().update({
      where: { id },
      data: {
        ...data,
        updatedAt: new Date(),
      },
      include: {
        user: {
          select: {
            uuid: true,
            name: true,
            email: true,
            avatarUrl: true,
          },
        },
      },
    });
  }

  async updateByUuid(uuid: string, data: CommentUpdateInput): Promise<Comment> {
    return this.getModel().update({
      where: { uuid },
      data: {
        ...data,
        updatedAt: new Date(),
      },
      include: {
        user: {
          select: {
            uuid: true,
            name: true,
            email: true,
            avatarUrl: true,
          },
        },
      },
    });
  }

  async resolve(id: bigint, resolvedById: bigint): Promise<Comment> {
    return this.getModel().update({
      where: { id },
      data: {
        isResolved: true,
        resolvedById,
        resolvedAt: new Date(),
      },
      include: {
        user: {
          select: {
            uuid: true,
            name: true,
            email: true,
            avatarUrl: true,
          },
        },
      },
    });
  }

  async unresolve(id: bigint): Promise<Comment> {
    return this.getModel().update({
      where: { id },
      data: {
        isResolved: false,
        resolvedById: null,
        resolvedAt: null,
      },
      include: {
        user: {
          select: {
            uuid: true,
            name: true,
            email: true,
            avatarUrl: true,
          },
        },
      },
    });
  }

  async softDelete(id: bigint): Promise<Comment> {
    return this.getModel().update({
      where: { id },
      data: {
        deletedAt: new Date(),
      },
    });
  }
}

