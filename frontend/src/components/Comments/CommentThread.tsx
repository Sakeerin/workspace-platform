import React, { useState, useEffect } from 'react';
import { useCommentsStore, Comment } from '../../store/comments';
import CommentItem from './CommentItem';

interface CommentThreadProps {
  pageUuid: string;
  blockUuid?: string;
}

/**
 * Comment Thread Component
 * 
 * Displays and manages threaded comments for a page or block.
 * Supports creating new comments, replying to existing comments,
 * and resolving comment threads.
 * 
 * @param {CommentThreadProps} props - Component props
 * @param {string} props.pageUuid - UUID of the page
 * @param {string} [props.blockUuid] - Optional UUID of the block
 * 
 * @example
 * <CommentThread pageUuid="page-uuid" blockUuid="block-uuid" />
 */
export default function CommentThread({ pageUuid, blockUuid }: CommentThreadProps) {
  const { comments, isLoading, error, fetchComments, createComment } = useCommentsStore();
  const [newComment, setNewComment] = useState('');
  const [showInput, setShowInput] = useState(false);

  useEffect(() => {
    fetchComments(pageUuid, blockUuid);
  }, [pageUuid, blockUuid, fetchComments]);

  const handleCreateComment = async () => {
    if (!newComment.trim()) return;

    try {
      await createComment(pageUuid, newComment, blockUuid);
      setNewComment('');
      setShowInput(false);
    } catch (error) {
      console.error('Failed to create comment:', error);
    }
  };

  // Filter resolved comments (optional - can be toggled)
  const [showResolved, setShowResolved] = useState(false);
  const filteredComments = showResolved
    ? comments
    : comments.filter((comment) => !comment.is_resolved);

  return (
    <div className="border-t border-gray-200 pt-4">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-gray-900">
          Comments ({comments.length})
        </h3>
        <div className="flex items-center gap-2">
          <label className="flex items-center gap-2 text-sm text-gray-600">
            <input
              type="checkbox"
              checked={showResolved}
              onChange={(e) => setShowResolved(e.target.checked)}
              className="rounded"
            />
            Show resolved
          </label>
        </div>
      </div>

      {error && (
        <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-md text-sm text-red-700">
          {error}
        </div>
      )}

      {/* New comment input */}
      {!showInput ? (
        <button
          onClick={() => setShowInput(true)}
          className="w-full mb-4 px-4 py-2 text-left text-sm text-gray-600 border border-gray-300 rounded-md hover:bg-gray-50"
        >
          Add a comment...
        </button>
      ) : (
        <div className="mb-4 space-y-2">
          <textarea
            value={newComment}
            onChange={(e) => setNewComment(e.target.value)}
            placeholder="Write a comment... (Use @ to mention someone)"
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            rows={3}
          />
          <div className="flex gap-2">
            <button
              onClick={handleCreateComment}
              disabled={!newComment.trim() || isLoading}
              className="px-4 py-2 bg-blue-600 text-white text-sm rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isLoading ? 'Posting...' : 'Post Comment'}
            </button>
            <button
              onClick={() => {
                setShowInput(false);
                setNewComment('');
              }}
              className="px-4 py-2 bg-gray-200 text-gray-700 text-sm rounded-md hover:bg-gray-300"
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      {/* Comments list */}
      {isLoading && comments.length === 0 ? (
        <div className="text-center py-8 text-gray-500">Loading comments...</div>
      ) : filteredComments.length === 0 ? (
        <div className="text-center py-8 text-gray-500">No comments yet. Be the first to comment!</div>
      ) : (
        <div className="space-y-4">
          {filteredComments.map((comment) => (
            <CommentItem
              key={comment.uuid}
              comment={comment}
              pageUuid={pageUuid}
            />
          ))}
        </div>
      )}
    </div>
  );
}

