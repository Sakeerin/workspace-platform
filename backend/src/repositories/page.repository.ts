import { PrismaClient, Page } from '@prisma/client';
import { BaseRepository } from './base.repository';
import { PageCreateInput, PageUpdateInput } from '../models/page.model';
import prisma from '../config/database';

export class PageRepository extends BaseRepository<Page> {
  constructor() {
    super(prisma);
  }

  getModel() {
    return this.prisma.page;
  }

  async findByUuid(uuid: string): Promise<Page | null> {
    return this.getModel().findUnique({
      where: { uuid },
    });
  }

  async findByWorkspaceId(workspaceId: bigint): Promise<Page[]> {
    return this.getModel().findMany({
      where: {
        workspaceId,
        deletedAt: null,
        isArchived: false,
      },
      orderBy: {
        position: 'asc',
      },
    });
  }

  async findByParentId(parentId: bigint): Promise<Page[]> {
    return this.getModel().findMany({
      where: {
        parentId,
        deletedAt: null,
      },
      orderBy: {
        position: 'asc',
      },
    });
  }

  async create(data: PageCreateInput): Promise<Page> {
    return this.getModel().create({
      data: {
        ...data,
        content: data.content || {},
        visibility: data.visibility || 'workspace',
        type: data.type || 'page',
      },
    });
  }

  async update(id: bigint, data: PageUpdateInput): Promise<Page> {
    return this.getModel().update({
      where: { id },
      data: {
        ...data,
        updatedAt: new Date(),
      },
    });
  }

  async updateByUuid(uuid: string, data: PageUpdateInput): Promise<Page> {
    return this.getModel().update({
      where: { uuid },
      data: {
        ...data,
        updatedAt: new Date(),
      },
    });
  }

  async softDelete(id: bigint): Promise<Page> {
    return this.getModel().update({
      where: { id },
      data: {
        deletedAt: new Date(),
      },
    });
  }
}

