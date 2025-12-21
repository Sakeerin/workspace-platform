import { create } from 'zustand';
import api from '../services/api';
import { Database, DatabaseRow, CreateDatabaseInput, UpdateDatabaseInput, CreateDatabaseRowInput, UpdateDatabaseRowInput } from '../types/database.types';

interface DatabaseState {
  databases: Database[];
  currentDatabase: Database | null;
  rows: DatabaseRow[];
  currentView: string | null;
  isLoading: boolean;
  error: string | null;

  // Database operations
  fetchDatabase: (databaseUuid: string) => Promise<void>;
  createDatabase: (workspaceUuid: string, input: CreateDatabaseInput) => Promise<Database>;
  updateDatabase: (databaseUuid: string, input: UpdateDatabaseInput) => Promise<Database>;
  deleteDatabase: (databaseUuid: string) => Promise<void>;
  setCurrentDatabase: (database: Database | null) => void;

  // Row operations
  fetchRows: (databaseUuid: string) => Promise<void>;
  createRow: (databaseUuid: string, input: CreateDatabaseRowInput) => Promise<DatabaseRow>;
  updateRow: (databaseUuid: string, rowUuid: string, input: UpdateDatabaseRowInput) => Promise<DatabaseRow>;
  deleteRow: (databaseUuid: string, rowUuid: string) => Promise<void>;

  // View operations
  setCurrentView: (viewId: string | null) => void;
}

export const useDatabaseStore = create<DatabaseState>((set, get) => ({
  databases: [],
  currentDatabase: null,
  rows: [],
  currentView: null,
  isLoading: false,
  error: null,

  fetchDatabase: async (databaseUuid: string) => {
    set({ isLoading: true, error: null });
    try {
      const response = await api.get<{
        success: boolean;
        data: Database;
      }>(`/databases/${databaseUuid}`);

      const database = response.data;
      set({
        currentDatabase: database,
        currentView: database.default_view_id || null,
        isLoading: false,
      });

      // Fetch rows for this database
      await get().fetchRows(databaseUuid);
    } catch (error: any) {
      set({
        error: error.message || 'Failed to fetch database',
        isLoading: false,
      });
    }
  },

  createDatabase: async (workspaceUuid: string, input: CreateDatabaseInput) => {
    set({ isLoading: true, error: null });
    try {
      const response = await api.post<{
        success: boolean;
        data: Database;
      }>(`/databases`, {
        ...input,
        page_id: input.page_id,
      });

      const newDatabase = response.data;
      set((state) => ({
        databases: [...state.databases, newDatabase],
        currentDatabase: newDatabase,
        currentView: newDatabase.default_view_id || null,
        isLoading: false,
      }));

      return newDatabase;
    } catch (error: any) {
      set({
        error: error.message || 'Failed to create database',
        isLoading: false,
      });
      throw error;
    }
  },

  updateDatabase: async (databaseUuid: string, input: UpdateDatabaseInput) => {
    set({ isLoading: true, error: null });
    try {
      const response = await api.put<{
        success: boolean;
        data: Database;
      }>(`/databases/${databaseUuid}`, input);

      const updatedDatabase = response.data;
      set((state) => ({
        databases: state.databases.map((d) => (d.uuid === databaseUuid ? updatedDatabase : d)),
        currentDatabase: state.currentDatabase?.uuid === databaseUuid ? updatedDatabase : state.currentDatabase,
        isLoading: false,
      }));

      return updatedDatabase;
    } catch (error: any) {
      set({
        error: error.message || 'Failed to update database',
        isLoading: false,
      });
      throw error;
    }
  },

  deleteDatabase: async (databaseUuid: string) => {
    set({ isLoading: true, error: null });
    try {
      await api.delete(`/databases/${databaseUuid}`);

      set((state) => ({
        databases: state.databases.filter((d) => d.uuid !== databaseUuid),
        currentDatabase: state.currentDatabase?.uuid === databaseUuid ? null : state.currentDatabase,
        rows: state.currentDatabase?.uuid === databaseUuid ? [] : state.rows,
        isLoading: false,
      }));
    } catch (error: any) {
      set({
        error: error.message || 'Failed to delete database',
        isLoading: false,
      });
      throw error;
    }
  },

  setCurrentDatabase: (database: Database | null) => {
    set({
      currentDatabase: database,
      currentView: database?.default_view_id || null,
      rows: [],
    });
  },

  fetchRows: async (databaseUuid: string) => {
    set({ isLoading: true, error: null });
    try {
      const response = await api.get<{
        success: boolean;
        data: DatabaseRow[];
      }>(`/databases/${databaseUuid}/rows`);

      set({
        rows: response.data,
        isLoading: false,
      });
    } catch (error: any) {
      set({
        error: error.message || 'Failed to fetch rows',
        isLoading: false,
      });
    }
  },

  createRow: async (databaseUuid: string, input: CreateDatabaseRowInput) => {
    set({ isLoading: true, error: null });
    try {
      const response = await api.post<{
        success: boolean;
        data: DatabaseRow;
      }>(`/databases/${databaseUuid}/rows`, input);

      const newRow = response.data;
      set((state) => ({
        rows: [...state.rows, newRow],
        isLoading: false,
      }));

      return newRow;
    } catch (error: any) {
      set({
        error: error.message || 'Failed to create row',
        isLoading: false,
      });
      throw error;
    }
  },

  updateRow: async (databaseUuid: string, rowUuid: string, input: UpdateDatabaseRowInput) => {
    set({ isLoading: true, error: null });
    try {
      const response = await api.put<{
        success: boolean;
        data: DatabaseRow;
      }>(`/databases/${databaseUuid}/rows/${rowUuid}`, input);

      const updatedRow = response.data;
      set((state) => ({
        rows: state.rows.map((r) => (r.uuid === rowUuid ? updatedRow : r)),
        isLoading: false,
      }));

      return updatedRow;
    } catch (error: any) {
      set({
        error: error.message || 'Failed to update row',
        isLoading: false,
      });
      throw error;
    }
  },

  deleteRow: async (databaseUuid: string, rowUuid: string) => {
    set({ isLoading: true, error: null });
    try {
      await api.delete(`/databases/${databaseUuid}/rows/${rowUuid}`);

      set((state) => ({
        rows: state.rows.filter((r) => r.uuid !== rowUuid),
        isLoading: false,
      }));
    } catch (error: any) {
      set({
        error: error.message || 'Failed to delete row',
        isLoading: false,
      });
      throw error;
    }
  },

  setCurrentView: (viewId: string | null) => {
    set({ currentView: viewId });
  },
}));

