import { PrismaClient, WorkspaceMember } from '@prisma/client';
import { BaseRepository } from './base.repository';
import {
  WorkspaceMemberCreateInput,
  WorkspaceMemberUpdateInput,
} from '../models/workspace-member.model';
import prisma from '../config/database';

export class WorkspaceMemberRepository extends BaseRepository<WorkspaceMember> {
  constructor() {
    super(prisma);
  }

  getModel() {
    return this.prisma.workspaceMember;
  }

  async findByWorkspaceAndUser(
    workspaceId: bigint,
    userId: bigint
  ): Promise<WorkspaceMember | null> {
    return this.getModel().findUnique({
      where: {
        workspaceId_userId: {
          workspaceId,
          userId,
        },
      },
    });
  }

  async findByWorkspaceId(workspaceId: bigint): Promise<WorkspaceMember[]> {
    return this.getModel().findMany({
      where: {
        workspaceId,
        isActive: true,
      },
      include: {
        user: true,
      },
    });
  }

  async findByUserId(userId: bigint): Promise<WorkspaceMember[]> {
    return this.getModel().findMany({
      where: {
        userId,
        isActive: true,
      },
      include: {
        workspace: true,
      },
    });
  }

  async create(data: WorkspaceMemberCreateInput): Promise<WorkspaceMember> {
    return this.getModel().create({
      data: {
        ...data,
        permissions: data.permissions || {},
      },
    });
  }

  async update(
    workspaceId: bigint,
    userId: bigint,
    data: WorkspaceMemberUpdateInput
  ): Promise<WorkspaceMember> {
    return this.getModel().update({
      where: {
        workspaceId_userId: {
          workspaceId,
          userId,
        },
      },
      data,
    });
  }
}

