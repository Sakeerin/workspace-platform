import { create } from 'zustand';
import api from '../services/api';

export interface Comment {
  uuid: string;
  page_id: string;
  block_id?: string;
  parent_comment_id?: string;
  user: {
    uuid: string;
    name: string;
    email: string;
    avatar_url?: string;
  };
  content: string;
  mentions: string[];
  is_resolved: boolean;
  resolved_by?: string;
  resolved_at?: string;
  created_at: string;
  updated_at: string;
  child_comments?: Comment[];
}

interface CommentsState {
  comments: Comment[];
  isLoading: boolean;
  error: string | null;

  // Comment operations
  fetchComments: (pageUuid: string, blockUuid?: string) => Promise<void>;
  createComment: (pageUuid: string, content: string, blockUuid?: string, parentCommentUuid?: string, mentions?: string[]) => Promise<Comment>;
  updateComment: (pageUuid: string, commentUuid: string, content: string, mentions?: string[]) => Promise<Comment>;
  deleteComment: (pageUuid: string, commentUuid: string) => Promise<void>;
  resolveComment: (pageUuid: string, commentUuid: string, resolved: boolean) => Promise<Comment>;
}

export const useCommentsStore = create<CommentsState>((set, get) => ({
  comments: [],
  isLoading: false,
  error: null,

  fetchComments: async (pageUuid: string, blockUuid?: string) => {
    set({ isLoading: true, error: null });
    try {
      const url = blockUuid 
        ? `/pages/${pageUuid}/comments?block_id=${blockUuid}`
        : `/pages/${pageUuid}/comments`;
      
      const response = await api.get<{
        success: boolean;
        data: Comment[];
      }>(url);

      set({
        comments: response.data,
        isLoading: false,
      });
    } catch (error: any) {
      set({
        error: error.message || 'Failed to fetch comments',
        isLoading: false,
      });
    }
  },

  createComment: async (pageUuid: string, content: string, blockUuid?: string, parentCommentUuid?: string, mentions?: string[]) => {
    set({ isLoading: true, error: null });
    try {
      const response = await api.post<{
        success: boolean;
        data: Comment;
      }>(`/pages/${pageUuid}/comments`, {
        content,
        block_id: blockUuid,
        parent_comment_id: parentCommentUuid,
        mentions,
      });

      const newComment = response.data;
      
      // Add to comments list
      if (parentCommentUuid) {
        // Add as child comment
        set((state) => ({
          comments: state.comments.map((comment) => {
            if (comment.uuid === parentCommentUuid) {
              return {
                ...comment,
                child_comments: [...(comment.child_comments || []), newComment],
              };
            }
            return comment;
          }),
          isLoading: false,
        }));
      } else {
        // Add as top-level comment
        set((state) => ({
          comments: [newComment, ...state.comments],
          isLoading: false,
        }));
      }

      return newComment;
    } catch (error: any) {
      set({
        error: error.message || 'Failed to create comment',
        isLoading: false,
      });
      throw error;
    }
  },

  updateComment: async (pageUuid: string, commentUuid: string, content: string, mentions?: string[]) => {
    set({ isLoading: true, error: null });
    try {
      const response = await api.put<{
        success: boolean;
        data: Comment;
      }>(`/pages/${pageUuid}/comments/${commentUuid}`, {
        content,
        mentions,
      });

      const updatedComment = response.data;
      
      // Update in comments list
      set((state) => ({
        comments: state.comments.map((comment) => {
          if (comment.uuid === commentUuid) {
            return updatedComment;
          }
          // Check child comments
          if (comment.child_comments) {
            return {
              ...comment,
              child_comments: comment.child_comments.map((child) =>
                child.uuid === commentUuid ? updatedComment : child
              ),
            };
          }
          return comment;
        }),
        isLoading: false,
      }));

      return updatedComment;
    } catch (error: any) {
      set({
        error: error.message || 'Failed to update comment',
        isLoading: false,
      });
      throw error;
    }
  },

  deleteComment: async (pageUuid: string, commentUuid: string) => {
    set({ isLoading: true, error: null });
    try {
      await api.delete(`/pages/${pageUuid}/comments/${commentUuid}`);

      // Remove from comments list
      set((state) => ({
        comments: state.comments
          .filter((comment) => comment.uuid !== commentUuid)
          .map((comment) => ({
            ...comment,
            child_comments: comment.child_comments?.filter((child) => child.uuid !== commentUuid),
          })),
        isLoading: false,
      }));
    } catch (error: any) {
      set({
        error: error.message || 'Failed to delete comment',
        isLoading: false,
      });
      throw error;
    }
  },

  resolveComment: async (pageUuid: string, commentUuid: string, resolved: boolean) => {
    set({ isLoading: true, error: null });
    try {
      const response = await api.post<{
        success: boolean;
        data: Comment;
      }>(`/pages/${pageUuid}/comments/${commentUuid}/resolve`, {
        resolved,
      });

      const updatedComment = response.data;
      
      // Update in comments list
      set((state) => ({
        comments: state.comments.map((comment) => {
          if (comment.uuid === commentUuid) {
            return updatedComment;
          }
          // Check child comments
          if (comment.child_comments) {
            return {
              ...comment,
              child_comments: comment.child_comments.map((child) =>
                child.uuid === commentUuid ? updatedComment : child
              ),
            };
          }
          return comment;
        }),
        isLoading: false,
      }));

      return updatedComment;
    } catch (error: any) {
      set({
        error: error.message || 'Failed to resolve comment',
        isLoading: false,
      });
      throw error;
    }
  },
}));

