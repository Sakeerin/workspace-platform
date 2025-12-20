import { create } from 'zustand';
import api from '../services/api';

interface Workspace {
  uuid: string;
  name: string;
  slug: string;
  icon?: string;
  plan: string;
  createdAt: string;
}

interface WorkspaceState {
  workspaces: Workspace[];
  currentWorkspace: Workspace | null;
  isLoading: boolean;
  error: string | null;
  fetchWorkspaces: () => Promise<void>;
  createWorkspace: (name: string, icon?: string) => Promise<Workspace>;
  setCurrentWorkspace: (workspace: Workspace | null) => void;
}

export const useWorkspaceStore = create<WorkspaceState>((set, get) => ({
  workspaces: [],
  currentWorkspace: null,
  isLoading: false,
  error: null,

  fetchWorkspaces: async () => {
    set({ isLoading: true, error: null });
    try {
      const response = await api.get<{
        success: boolean;
        data: Workspace[];
      }>('/workspaces');

      set({
        workspaces: response.data,
        isLoading: false,
      });
    } catch (error: any) {
      set({
        error: error.message || 'Failed to fetch workspaces',
        isLoading: false,
      });
    }
  },

  createWorkspace: async (name: string, icon?: string) => {
    set({ isLoading: true, error: null });
    try {
      const response = await api.post<{
        success: boolean;
        data: Workspace;
      }>('/workspaces', { name, icon });

      const newWorkspace = response.data;
      set((state) => ({
        workspaces: [...state.workspaces, newWorkspace],
        isLoading: false,
      }));

      return newWorkspace;
    } catch (error: any) {
      set({
        error: error.message || 'Failed to create workspace',
        isLoading: false,
      });
      throw error;
    }
  },

  setCurrentWorkspace: (workspace: Workspace | null) => {
    set({ currentWorkspace: workspace });
  },
}));

