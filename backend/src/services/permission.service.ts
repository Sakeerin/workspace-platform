import { Injectable } from '@nestjs/common';
import { WorkspaceMemberRepository } from '../repositories/workspace-member.repository';

export type Permission = 'view' | 'comment' | 'edit' | 'full_access';

@Injectable()
export class PermissionService {
  constructor(private workspaceMemberRepo: WorkspaceMemberRepository) {}

  async getUserWorkspaceRole(
    userId: bigint,
    workspaceId: bigint
  ): Promise<'owner' | 'admin' | 'member' | 'guest' | null> {
    const member = await this.workspaceMemberRepo.findByWorkspaceAndUser(
      workspaceId,
      userId
    );

    if (!member || !member.isActive) {
      return null;
    }

    return member.role as 'owner' | 'admin' | 'member' | 'guest';
  }

  async canAccessWorkspace(
    userId: bigint,
    workspaceId: bigint
  ): Promise<boolean> {
    const role = await this.getUserWorkspaceRole(userId, workspaceId);
    return role !== null;
  }

  async canManageWorkspace(
    userId: bigint,
    workspaceId: bigint
  ): Promise<boolean> {
    const role = await this.getUserWorkspaceRole(userId, workspaceId);
    return role === 'owner' || role === 'admin';
  }

  async canManageMembers(
    userId: bigint,
    workspaceId: bigint
  ): Promise<boolean> {
    const role = await this.getUserWorkspaceRole(userId, workspaceId);
    return role === 'owner' || role === 'admin';
  }

  async requireWorkspaceAccess(
    userId: bigint,
    workspaceId: bigint
  ): Promise<void> {
    const canAccess = await this.canAccessWorkspace(userId, workspaceId);
    if (!canAccess) {
      throw new Error('Access denied to workspace');
    }
  }

  async requireWorkspaceManagement(
    userId: bigint,
    workspaceId: bigint
  ): Promise<void> {
    const canManage = await this.canManageWorkspace(userId, workspaceId);
    if (!canManage) {
      throw new Error('Workspace management access denied');
    }
  }
}

