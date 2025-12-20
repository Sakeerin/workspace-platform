import { create } from 'zustand';
import api from '../services/api';

interface Block {
  uuid: string;
  type: string;
  content: Record<string, any>;
  properties?: Record<string, any>;
  position: number;
  depth: number;
  parent_block_id?: string;
  createdAt: string;
  updatedAt: string;
}

interface EditorState {
  blocks: Block[];
  isLoading: boolean;
  error: string | null;
  fetchBlocks: (pageUuid: string) => Promise<void>;
  createBlock: (pageUuid: string, type: string, content: Record<string, any>, parentBlockId?: string, position?: number) => Promise<Block>;
  updateBlock: (pageUuid: string, blockUuid: string, content?: Record<string, any>, properties?: Record<string, any>) => Promise<Block>;
  deleteBlock: (pageUuid: string, blockUuid: string) => Promise<void>;
}

export const useEditorStore = create<EditorState>((set, get) => ({
  blocks: [],
  isLoading: false,
  error: null,

  fetchBlocks: async (pageUuid: string) => {
    set({ isLoading: true, error: null });
    try {
      const response = await api.get<{
        success: boolean;
        data: Block[];
      }>(`/pages/${pageUuid}/blocks`);

      set({
        blocks: response.data.sort((a, b) => a.position - b.position),
        isLoading: false,
      });
    } catch (error: any) {
      set({
        error: error.message || 'Failed to fetch blocks',
        isLoading: false,
      });
    }
  },

  createBlock: async (pageUuid: string, type: string, content: Record<string, any>, parentBlockId?: string, position?: number) => {
    set({ isLoading: true, error: null });
    try {
      const response = await api.post<{
        success: boolean;
        data: Block;
      }>(`/pages/${pageUuid}/blocks`, {
        type,
        content,
        parent_block_id: parentBlockId,
        position,
      });

      const newBlock = response.data;
      set((state) => ({
        blocks: [...state.blocks, newBlock].sort((a, b) => a.position - b.position),
        isLoading: false,
      }));

      return newBlock;
    } catch (error: any) {
      set({
        error: error.message || 'Failed to create block',
        isLoading: false,
      });
      throw error;
    }
  },

  updateBlock: async (pageUuid: string, blockUuid: string, content?: Record<string, any>, properties?: Record<string, any>) => {
    set({ isLoading: true, error: null });
    try {
      const response = await api.patch<{
        success: boolean;
        data: Block;
      }>(`/pages/${pageUuid}/blocks/${blockUuid}`, {
        content,
        properties,
      });

      const updatedBlock = response.data;
      set((state) => ({
        blocks: state.blocks.map((b) => (b.uuid === blockUuid ? updatedBlock : b)),
        isLoading: false,
      }));

      return updatedBlock;
    } catch (error: any) {
      set({
        error: error.message || 'Failed to update block',
        isLoading: false,
      });
      throw error;
    }
  },

  deleteBlock: async (pageUuid: string, blockUuid: string) => {
    set({ isLoading: true, error: null });
    try {
      await api.delete(`/pages/${pageUuid}/blocks/${blockUuid}`);

      set((state) => ({
        blocks: state.blocks.filter((b) => b.uuid !== blockUuid),
        isLoading: false,
      }));
    } catch (error: any) {
      set({
        error: error.message || 'Failed to delete block',
        isLoading: false,
      });
      throw error;
    }
  },
}));

