import React, { useState } from 'react';
import { Comment } from '../../store/comments';
import { useCommentsStore } from '../../store/comments';
import { useAuthStore } from '../../store/auth';

interface CommentItemProps {
  comment: Comment;
  pageUuid: string;
  depth?: number;
}

export default function CommentItem({ comment, pageUuid, depth = 0 }: CommentItemProps) {
  const { user: currentUser } = useAuthStore();
  const { updateComment, deleteComment, resolveComment, createComment } = useCommentsStore();
  const [isEditing, setIsEditing] = useState(false);
  const [isReplying, setIsReplying] = useState(false);
  const [editContent, setEditContent] = useState(comment.content);
  const [replyContent, setReplyContent] = useState('');

  const isAuthor = currentUser?.uuid === comment.user.uuid;
  const maxDepth = 3; // Limit nesting depth

  const handleUpdate = async () => {
    try {
      await updateComment(pageUuid, comment.uuid, editContent);
      setIsEditing(false);
    } catch (error) {
      console.error('Failed to update comment:', error);
    }
  };

  const handleDelete = async () => {
    if (!confirm('Are you sure you want to delete this comment?')) {
      return;
    }
    try {
      await deleteComment(pageUuid, comment.uuid);
    } catch (error) {
      console.error('Failed to delete comment:', error);
    }
  };

  const handleReply = async () => {
    if (!replyContent.trim()) return;
    
    try {
      await createComment(pageUuid, replyContent, comment.block_id, comment.uuid);
      setReplyContent('');
      setIsReplying(false);
    } catch (error) {
      console.error('Failed to create reply:', error);
    }
  };

  const handleResolve = async () => {
    try {
      await resolveComment(pageUuid, comment.uuid, !comment.is_resolved);
    } catch (error) {
      console.error('Failed to resolve comment:', error);
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(minutes / 60);
    const days = Math.floor(hours / 24);

    if (minutes < 1) return 'just now';
    if (minutes < 60) return `${minutes}m ago`;
    if (hours < 24) return `${hours}h ago`;
    if (days < 7) return `${days}d ago`;
    return date.toLocaleDateString();
  };

  return (
    <div className={`${depth > 0 ? 'ml-8 mt-2' : ''} border-l-2 border-gray-200 pl-4`}>
      <div className="flex items-start gap-3">
        <div className="flex-shrink-0">
          {comment.user.avatar_url ? (
            <img
              src={comment.user.avatar_url}
              alt={comment.user.name}
              className="w-8 h-8 rounded-full"
            />
          ) : (
            <div className="w-8 h-8 rounded-full bg-blue-500 flex items-center justify-center text-white text-sm font-medium">
              {comment.user.name.charAt(0).toUpperCase()}
            </div>
          )}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <span className="font-medium text-sm text-gray-900">{comment.user.name}</span>
            <span className="text-xs text-gray-500">{formatDate(comment.created_at)}</span>
            {comment.is_resolved && (
              <span className="text-xs px-2 py-0.5 bg-green-100 text-green-700 rounded-full">
                Resolved
              </span>
            )}
          </div>

          {isEditing ? (
            <div className="space-y-2">
              <textarea
                value={editContent}
                onChange={(e) => setEditContent(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                rows={3}
              />
              <div className="flex gap-2">
                <button
                  onClick={handleUpdate}
                  className="px-3 py-1 bg-blue-600 text-white text-sm rounded-md hover:bg-blue-700"
                >
                  Save
                </button>
                <button
                  onClick={() => {
                    setIsEditing(false);
                    setEditContent(comment.content);
                  }}
                  className="px-3 py-1 bg-gray-200 text-gray-700 text-sm rounded-md hover:bg-gray-300"
                >
                  Cancel
                </button>
              </div>
            </div>
          ) : (
            <>
              <div className="text-sm text-gray-700 whitespace-pre-wrap mb-2">
                {comment.content}
              </div>
              <div className="flex items-center gap-2 text-xs text-gray-500">
                {!comment.is_resolved && (
                  <button
                    onClick={handleResolve}
                    className="hover:text-green-600"
                  >
                    Resolve
                  </button>
                )}
                {comment.is_resolved && (
                  <button
                    onClick={handleResolve}
                    className="hover:text-gray-700"
                  >
                    Unresolve
                  </button>
                )}
                {depth < maxDepth && (
                  <button
                    onClick={() => setIsReplying(!isReplying)}
                    className="hover:text-blue-600"
                  >
                    Reply
                  </button>
                )}
                {isAuthor && (
                  <>
                    <button
                      onClick={() => setIsEditing(true)}
                      className="hover:text-blue-600"
                    >
                      Edit
                    </button>
                    <button
                      onClick={handleDelete}
                      className="hover:text-red-600"
                    >
                      Delete
                    </button>
                  </>
                )}
              </div>
            </>
          )}

          {isReplying && (
            <div className="mt-3 space-y-2">
              <textarea
                value={replyContent}
                onChange={(e) => setReplyContent(e.target.value)}
                placeholder="Write a reply..."
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                rows={2}
              />
              <div className="flex gap-2">
                <button
                  onClick={handleReply}
                  disabled={!replyContent.trim()}
                  className="px-3 py-1 bg-blue-600 text-white text-sm rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Reply
                </button>
                <button
                  onClick={() => {
                    setIsReplying(false);
                    setReplyContent('');
                  }}
                  className="px-3 py-1 bg-gray-200 text-gray-700 text-sm rounded-md hover:bg-gray-300"
                >
                  Cancel
                </button>
              </div>
            </div>
          )}

          {/* Child comments */}
          {comment.child_comments && comment.child_comments.length > 0 && (
            <div className="mt-3 space-y-2">
              {comment.child_comments.map((child) => (
                <CommentItem
                  key={child.uuid}
                  comment={child}
                  pageUuid={pageUuid}
                  depth={depth + 1}
                />
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

