import { Injectable } from '@nestjs/common';
import { PrismaClient, Database } from '@prisma/client';
import { BaseRepository } from './base.repository';
import { DatabaseCreateInput, DatabaseUpdateInput } from '../models/database.model';
import prisma from '../config/database';

@Injectable()
export class DatabaseRepository extends BaseRepository<Database> {
  constructor() {
    super(prisma);
  }

  getModel() {
    return this.prisma.database;
  }

  async findByUuid(uuid: string): Promise<Database | null> {
    return this.getModel().findUnique({
      where: { uuid },
    });
  }

  async findByPageId(pageId: bigint): Promise<Database | null> {
    return this.getModel().findFirst({
      where: {
        pageId,
        deletedAt: null,
      },
    });
  }

  async findByWorkspaceId(workspaceId: bigint): Promise<Database[]> {
    return this.getModel().findMany({
      where: {
        workspaceId,
        deletedAt: null,
      },
      orderBy: {
        createdAt: 'desc',
      },
    });
  }

  async create(data: DatabaseCreateInput): Promise<Database> {
    return this.getModel().create({
      data: {
        ...data,
        properties: data.properties || {},
        views: data.views || [],
      },
    });
  }

  async update(id: bigint, data: DatabaseUpdateInput): Promise<Database> {
    return this.getModel().update({
      where: { id },
      data: {
        ...data,
        updatedAt: new Date(),
      },
    });
  }

  async updateByUuid(uuid: string, data: DatabaseUpdateInput): Promise<Database> {
    return this.getModel().update({
      where: { uuid },
      data: {
        ...data,
        updatedAt: new Date(),
      },
    });
  }

  async softDelete(id: bigint): Promise<Database> {
    return this.getModel().update({
      where: { id },
      data: {
        deletedAt: new Date(),
      },
    });
  }
}

