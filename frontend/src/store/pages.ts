import { create } from 'zustand';
import api from '../services/api';

interface Page {
  uuid: string;
  title: string;
  icon?: string;
  type: 'page' | 'database';
  visibility: 'private' | 'workspace' | 'public';
  parent_id?: string;
  createdAt: string;
  updatedAt: string;
}

interface PagesState {
  pages: Page[];
  currentPage: Page | null;
  isLoading: boolean;
  error: string | null;
  fetchPages: (workspaceUuid: string) => Promise<void>;
  createPage: (workspaceUuid: string, title: string, icon?: string, parentId?: string) => Promise<Page>;
  updatePage: (workspaceUuid: string, pageUuid: string, updates: Partial<Page>) => Promise<Page>;
  deletePage: (workspaceUuid: string, pageUuid: string) => Promise<void>;
  setCurrentPage: (page: Page | null) => void;
}

export const usePagesStore = create<PagesState>((set, get) => ({
  pages: [],
  currentPage: null,
  isLoading: false,
  error: null,

  fetchPages: async (workspaceUuid: string) => {
    set({ isLoading: true, error: null });
    try {
      const response = await api.get<{
        success: boolean;
        data: Page[];
      }>(`/workspaces/${workspaceUuid}/pages`);

      set({
        pages: response.data,
        isLoading: false,
      });
    } catch (error: any) {
      set({
        error: error.message || 'Failed to fetch pages',
        isLoading: false,
      });
    }
  },

  createPage: async (workspaceUuid: string, title: string, icon?: string, parentId?: string) => {
    set({ isLoading: true, error: null });
    try {
      const response = await api.post<{
        success: boolean;
        data: Page;
      }>(`/workspaces/${workspaceUuid}/pages`, {
        title,
        icon,
        parent_id: parentId,
      });

      const newPage = response.data;
      set((state) => ({
        pages: [...state.pages, newPage],
        isLoading: false,
      }));

      return newPage;
    } catch (error: any) {
      set({
        error: error.message || 'Failed to create page',
        isLoading: false,
      });
      throw error;
    }
  },

  updatePage: async (workspaceUuid: string, pageUuid: string, updates: Partial<Page>) => {
    set({ isLoading: true, error: null });
    try {
      const response = await api.patch<{
        success: boolean;
        data: Page;
      }>(`/workspaces/${workspaceUuid}/pages/${pageUuid}`, updates);

      const updatedPage = response.data;
      set((state) => ({
        pages: state.pages.map((p) => (p.uuid === pageUuid ? updatedPage : p)),
        currentPage: state.currentPage?.uuid === pageUuid ? updatedPage : state.currentPage,
        isLoading: false,
      }));

      return updatedPage;
    } catch (error: any) {
      set({
        error: error.message || 'Failed to update page',
        isLoading: false,
      });
      throw error;
    }
  },

  deletePage: async (workspaceUuid: string, pageUuid: string) => {
    set({ isLoading: true, error: null });
    try {
      await api.delete(`/workspaces/${workspaceUuid}/pages/${pageUuid}`);

      set((state) => ({
        pages: state.pages.filter((p) => p.uuid !== pageUuid),
        currentPage: state.currentPage?.uuid === pageUuid ? null : state.currentPage,
        isLoading: false,
      }));
    } catch (error: any) {
      set({
        error: error.message || 'Failed to delete page',
        isLoading: false,
      });
      throw error;
    }
  },

  setCurrentPage: (page: Page | null) => {
    set({ currentPage: page });
  },
}));

