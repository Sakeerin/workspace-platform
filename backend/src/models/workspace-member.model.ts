import { WorkspaceMember } from '@prisma/client';

export type WorkspaceMemberModel = WorkspaceMember;

export type WorkspaceMemberRole = 'owner' | 'admin' | 'member' | 'guest';

export interface WorkspaceMemberCreateInput {
  workspaceId: bigint;
  userId: bigint;
  role: WorkspaceMemberRole;
  permissions?: Record<string, any>;
  invitedBy?: bigint;
}

export interface WorkspaceMemberUpdateInput {
  role?: WorkspaceMemberRole;
  permissions?: Record<string, any>;
  invitationAcceptedAt?: Date;
  lastAccessedAt?: Date;
  isActive?: boolean;
}

