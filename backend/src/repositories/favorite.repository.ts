import { PrismaClient, Favorite } from '@prisma/client';
import { BaseRepository } from './base.repository';
import { FavoriteCreateInput, FavoriteUpdateInput } from '../models/favorite.model';
import prisma from '../config/database';

export class FavoriteRepository extends BaseRepository<Favorite> {
  constructor() {
    super(prisma);
  }

  getModel() {
    return this.prisma.favorite;
  }

  async findById(id: bigint): Promise<Favorite | null> {
    return this.getModel().findUnique({
      where: { id },
      include: {
        page: {
          select: {
            uuid: true,
            title: true,
            icon: true,
            type: true,
            visibility: true,
            updatedAt: true,
          },
        },
      },
    });
  }

  async findByUserAndPage(userId: bigint, pageId: bigint): Promise<Favorite | null> {
    return this.getModel().findUnique({
      where: {
        userId_pageId: {
          userId,
          pageId,
        },
      },
    });
  }

  async findByUserId(userId: bigint): Promise<Favorite[]> {
    return this.getModel().findMany({
      where: {
        userId,
      },
      include: {
        page: {
          select: {
            uuid: true,
            title: true,
            icon: true,
            type: true,
            visibility: true,
            updatedAt: true,
          },
        },
      },
      orderBy: {
        position: 'asc',
      },
    });
  }

  async create(data: FavoriteCreateInput): Promise<Favorite> {
    // Get current max position for user
    const maxPosition = await this.getModel().findFirst({
      where: { userId: data.userId },
      orderBy: { position: 'desc' },
      select: { position: true },
    });

    const position = data.position ?? (maxPosition ? maxPosition.position + 1 : 0);

    return this.getModel().create({
      data: {
        ...data,
        position,
      },
      include: {
        page: {
          select: {
            uuid: true,
            title: true,
            icon: true,
            type: true,
            visibility: true,
            updatedAt: true,
          },
        },
      },
    });
  }

  async delete(userId: bigint, pageId: bigint): Promise<void> {
    await this.getModel().delete({
      where: {
        userId_pageId: {
          userId,
          pageId,
        },
      },
    });
  }

  async updatePosition(userId: bigint, pageId: bigint, position: number): Promise<Favorite> {
    return this.getModel().update({
      where: {
        userId_pageId: {
          userId,
          pageId,
        },
      },
      data: { position },
    });
  }
}

