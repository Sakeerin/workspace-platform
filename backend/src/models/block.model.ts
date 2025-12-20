import { Block } from '@prisma/client';

export type BlockModel = Block;

export interface BlockCreateInput {
  pageId: bigint;
  parentBlockId?: bigint;
  createdById: bigint;
  lastEditedById: bigint;
  type: string;
  content: Record<string, any>;
  contentText?: string;
  position?: number;
  depth?: number;
  properties?: Record<string, any>;
}

export interface BlockUpdateInput {
  type?: string;
  content?: Record<string, any>;
  contentText?: string;
  position?: number;
  depth?: number;
  properties?: Record<string, any>;
  lastEditedById?: bigint;
}

