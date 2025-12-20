import { PrismaClient, Workspace } from '@prisma/client';
import { BaseRepository } from './base.repository';
import { WorkspaceCreateInput, WorkspaceUpdateInput } from '../models/workspace.model';
import prisma from '../config/database';

export class WorkspaceRepository extends BaseRepository<Workspace> {
  constructor() {
    super(prisma);
  }

  getModel() {
    return this.prisma.workspace;
  }

  async findBySlug(slug: string): Promise<Workspace | null> {
    return this.getModel().findUnique({
      where: { slug },
    });
  }

  async findByUuid(uuid: string): Promise<Workspace | null> {
    return this.getModel().findUnique({
      where: { uuid },
    });
  }

  async findByUserId(userId: bigint): Promise<Workspace[]> {
    return this.getModel().findMany({
      where: {
        members: {
          some: {
            userId,
            isActive: true,
          },
        },
      },
      include: {
        members: {
          where: {
            userId,
            isActive: true,
          },
        },
      },
    });
  }

  async create(data: WorkspaceCreateInput): Promise<Workspace> {
    return this.getModel().create({
      data: {
        ...data,
        settings: data.settings || {},
        plan: data.plan || 'free',
        maxMembers: data.maxMembers || 10,
        maxStorageGb: data.maxStorageGb || 5,
      },
    });
  }

  async update(id: bigint, data: WorkspaceUpdateInput): Promise<Workspace> {
    return this.getModel().update({
      where: { id },
      data,
    });
  }

  async updateByUuid(uuid: string, data: WorkspaceUpdateInput): Promise<Workspace> {
    return this.getModel().update({
      where: { uuid },
      data,
    });
  }
}

