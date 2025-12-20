import { Page } from '@prisma/client';

export type PageModel = Page;

export interface PageCreateInput {
  workspaceId: bigint;
  parentId?: bigint;
  createdById: bigint;
  lastEditedById: bigint;
  title: string;
  icon?: string;
  coverImage?: string;
  coverPosition?: string;
  content?: Record<string, any>;
  contentText?: string;
  type?: 'page' | 'database';
  databaseType?: 'table' | 'board' | 'calendar' | 'gallery' | 'list' | 'timeline';
  isTemplate?: boolean;
  isFavorite?: boolean;
  isArchived?: boolean;
  isLocked?: boolean;
  visibility?: 'private' | 'workspace' | 'public';
  allowComments?: boolean;
  allowDuplicate?: boolean;
  slug?: string;
  metaDescription?: string;
  position?: number;
  publishedAt?: Date;
  archivedAt?: Date;
}

export interface PageUpdateInput {
  title?: string;
  icon?: string;
  coverImage?: string;
  coverPosition?: string;
  content?: Record<string, any>;
  contentText?: string;
  type?: 'page' | 'database';
  databaseType?: 'table' | 'board' | 'calendar' | 'gallery' | 'list' | 'timeline';
  isTemplate?: boolean;
  isFavorite?: boolean;
  isArchived?: boolean;
  isLocked?: boolean;
  visibility?: 'private' | 'workspace' | 'public';
  allowComments?: boolean;
  allowDuplicate?: boolean;
  slug?: string;
  metaDescription?: string;
  position?: number;
  publishedAt?: Date;
  archivedAt?: Date;
  lastEditedById?: bigint;
}

