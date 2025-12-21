import { Database } from '@prisma/client';

export type DatabaseModel = Database;

export interface DatabaseCreateInput {
  pageId: bigint;
  workspaceId: bigint;
  title?: string;
  description?: string;
  properties?: Record<string, any>;
  views?: any[];
  defaultViewId?: string;
}

export interface DatabaseUpdateInput {
  title?: string;
  description?: string;
  properties?: Record<string, any>;
  views?: any[];
  defaultViewId?: string;
}

export interface DatabaseProperty {
  type: 'title' | 'text' | 'number' | 'select' | 'multi_select' | 'date' | 'person' | 'checkbox' | 'url' | 'email' | 'phone' | 'formula' | 'relation' | 'rollup' | 'created_time' | 'created_by' | 'last_edited_time' | 'last_edited_by';
  name: string;
  options?: string[]; // For select/multi_select
  formula?: string; // For formula type
  relation?: {
    databaseId: string;
    propertyId: string;
  };
}

export interface DatabaseView {
  id: string;
  type: 'table' | 'board' | 'calendar' | 'gallery' | 'list' | 'timeline';
  name: string;
  filters?: any[];
  sorts?: any[];
  groupBy?: string;
  properties?: Record<string, any>;
}

