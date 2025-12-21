/**
 * Database Property Types
 * Defines all supported property types for database columns
 */
export type DatabasePropertyType =
  | 'title'
  | 'text'
  | 'number'
  | 'select'
  | 'multi_select'
  | 'date'
  | 'person'
  | 'checkbox'
  | 'url'
  | 'email'
  | 'phone'
  | 'formula'
  | 'relation'
  | 'rollup'
  | 'created_time'
  | 'created_by'
  | 'last_edited_time'
  | 'last_edited_by';

/**
 * Database View Types
 */
export type DatabaseViewType = 'table' | 'board' | 'calendar' | 'gallery' | 'list' | 'timeline';

/**
 * Database Property Definition
 */
export interface DatabaseProperty {
  type: DatabasePropertyType;
  name: string;
  options?: string[]; // For select/multi_select
  formula?: string; // For formula type
  relation?: {
    databaseId: string;
    propertyId: string;
  };
}

/**
 * Database View Configuration
 */
export interface DatabaseView {
  id: string;
  type: DatabaseViewType;
  name: string;
  filters?: DatabaseFilter[];
  sorts?: DatabaseSort[];
  groupBy?: string;
  properties?: Record<string, any>;
}

/**
 * Database Filter
 */
export interface DatabaseFilter {
  property: string;
  operator: 'equals' | 'not_equals' | 'contains' | 'not_contains' | 'greater_than' | 'less_than' | 'is_empty' | 'is_not_empty';
  value: any;
}

/**
 * Database Sort
 */
export interface DatabaseSort {
  property: string;
  direction: 'asc' | 'desc';
}

/**
 * Database Model
 */
export interface Database {
  uuid: string;
  page_id: string;
  workspace_id: string;
  title?: string;
  description?: string;
  properties: Record<string, DatabaseProperty>;
  views: DatabaseView[];
  default_view_id?: string;
  created_at: string;
  updated_at: string;
}

/**
 * Database Row Model
 */
export interface DatabaseRow {
  uuid: string;
  database_id: string;
  page_id?: string;
  properties: Record<string, any>;
  properties_text?: string;
  position: number;
  created_by: string;
  last_edited_by: string;
  created_at: string;
  updated_at: string;
}

/**
 * Database Row Property Value
 */
export type DatabaseRowPropertyValue =
  | string
  | number
  | boolean
  | string[]
  | Date
  | null
  | undefined;

/**
 * Create Database Input
 */
export interface CreateDatabaseInput {
  page_id: string;
  title?: string;
  description?: string;
  properties?: Record<string, DatabaseProperty>;
  views?: DatabaseView[];
  default_view_id?: string;
}

/**
 * Update Database Input
 */
export interface UpdateDatabaseInput {
  title?: string;
  description?: string;
  properties?: Record<string, DatabaseProperty>;
  views?: DatabaseView[];
  default_view_id?: string;
}

/**
 * Create Database Row Input
 */
export interface CreateDatabaseRowInput {
  properties: Record<string, any>;
  page_id?: string;
  position?: number;
}

/**
 * Update Database Row Input
 */
export interface UpdateDatabaseRowInput {
  properties?: Record<string, any>;
  position?: number;
}

