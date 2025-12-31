import { Injectable } from '@nestjs/common';
import { PrismaClient, DatabaseRow } from '@prisma/client';
import { BaseRepository } from './base.repository';
import { DatabaseRowCreateInput, DatabaseRowUpdateInput } from '../models/database-row.model';
import prisma from '../config/database';

@Injectable()
export class DatabaseRowRepository extends BaseRepository<DatabaseRow> {
  constructor() {
    super(prisma);
  }

  getModel() {
    return this.prisma.databaseRow;
  }

  async findByUuid(uuid: string): Promise<DatabaseRow | null> {
    return this.getModel().findUnique({
      where: { uuid },
    });
  }

  async findByDatabaseId(databaseId: bigint): Promise<DatabaseRow[]> {
    return this.getModel().findMany({
      where: {
        databaseId,
        deletedAt: null,
      },
      orderBy: {
        position: 'asc',
      },
    });
  }

  async findByPageId(pageId: bigint): Promise<DatabaseRow[]> {
    return this.getModel().findMany({
      where: {
        pageId,
        deletedAt: null,
      },
      orderBy: {
        position: 'asc',
      },
    });
  }

  async create(data: DatabaseRowCreateInput): Promise<DatabaseRow> {
    return this.getModel().create({
      data: {
        ...data,
        properties: data.properties || {},
        position: data.position ?? 0,
      },
    });
  }

  async update(id: bigint, data: DatabaseRowUpdateInput): Promise<DatabaseRow> {
    return this.getModel().update({
      where: { id },
      data: {
        ...data,
        updatedAt: new Date(),
      },
    });
  }

  async updateByUuid(uuid: string, data: DatabaseRowUpdateInput): Promise<DatabaseRow> {
    return this.getModel().update({
      where: { uuid },
      data: {
        ...data,
        updatedAt: new Date(),
      },
    });
  }

  async softDelete(id: bigint): Promise<DatabaseRow> {
    return this.getModel().update({
      where: { id },
      data: {
        deletedAt: new Date(),
      },
    });
  }
}

