import { DatabaseRow } from '@prisma/client';

export type DatabaseRowModel = DatabaseRow;

export interface DatabaseRowCreateInput {
  databaseId: bigint;
  pageId?: bigint;
  createdById: bigint;
  lastEditedById: bigint;
  properties: Record<string, any>;
  propertiesText?: string;
  position?: number;
}

export interface DatabaseRowUpdateInput {
  properties?: Record<string, any>;
  propertiesText?: string;
  position?: number;
  lastEditedById?: bigint;
}

