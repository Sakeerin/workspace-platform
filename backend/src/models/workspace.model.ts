import { Workspace } from '@prisma/client';

export type WorkspaceModel = Workspace;

export interface WorkspaceCreateInput {
  name: string;
  slug: string;
  domain?: string;
  icon?: string;
  coverImage?: string;
  settings?: Record<string, any>;
  plan?: 'free' | 'personal' | 'team' | 'enterprise';
  maxMembers?: number;
  maxStorageGb?: number;
}

export interface WorkspaceUpdateInput {
  name?: string;
  icon?: string;
  coverImage?: string;
  settings?: Record<string, any>;
  plan?: 'free' | 'personal' | 'team' | 'enterprise';
  planExpiresAt?: Date;
  maxMembers?: number;
  maxStorageGb?: number;
  isActive?: boolean;
}

