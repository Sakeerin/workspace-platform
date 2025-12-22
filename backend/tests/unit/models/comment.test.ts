import { CommentRepository } from '../../../src/repositories/comment.repository';
import { CommentCreateInput } from '../../../src/models/comment.model';

describe('Comment Model', () => {
  let commentRepository: CommentRepository;

  beforeEach(() => {
    commentRepository = new CommentRepository();
  });

  describe('CommentRepository', () => {
    it('should create a comment with required fields', async () => {
      // This test requires test setup (page and user)
      // In practice, use test fixtures or database seeding
      const commentData: CommentCreateInput = {
        pageId: BigInt(1), // Would come from test fixture
        userId: BigInt(1),
        content: 'Test comment content',
      };

      const comment = await commentRepository.create(commentData);

      expect(comment).toBeDefined();
      expect(comment.content).toBe(commentData.content);
      expect(comment.pageId).toBe(commentData.pageId);
      expect(comment.userId).toBe(commentData.userId);
      expect(comment.uuid).toBeDefined();
      expect(comment.isResolved).toBe(false);
      expect(comment.mentions).toBeDefined();
      expect(Array.isArray(comment.mentions)).toBe(true);
      expect(comment.createdAt).toBeDefined();
      expect(comment.updatedAt).toBeDefined();
    });

    it('should create a comment with optional fields', async () => {
      const commentData: CommentCreateInput = {
        pageId: BigInt(1),
        userId: BigInt(1),
        content: 'Comment with block and mentions',
        blockId: BigInt(1),
        mentions: ['user-uuid-1', 'user-uuid-2'],
      };

      const comment = await commentRepository.create(commentData);

      expect(comment.blockId).toBe(commentData.blockId);
      expect(comment.mentions).toEqual(commentData.mentions);
    });

    it('should find comment by UUID', async () => {
      const created = await commentRepository.create({
        pageId: BigInt(1),
        userId: BigInt(1),
        content: 'Find Me Comment',
      });

      const found = await commentRepository.findByUuid(created.uuid);

      expect(found).toBeDefined();
      expect(found?.uuid).toBe(created.uuid);
      expect(found?.content).toBe('Find Me Comment');
    });

    it('should return null when comment not found by UUID', async () => {
      const found = await commentRepository.findByUuid('00000000-0000-0000-0000-000000000000');
      expect(found).toBeNull();
    });

    it('should find comments by page ID', async () => {
      const pageId = BigInt(1);
      
      await commentRepository.create({
        pageId,
        userId: BigInt(1),
        content: 'Comment 1',
      });

      await commentRepository.create({
        pageId,
        userId: BigInt(1),
        content: 'Comment 2',
      });

      const comments = await commentRepository.findByPageId(pageId);

      expect(comments.length).toBeGreaterThanOrEqual(2);
      expect(comments.some(c => c.content === 'Comment 1')).toBe(true);
      expect(comments.some(c => c.content === 'Comment 2')).toBe(true);
    });

    it('should support threaded comments with parent_comment_id', async () => {
      const parentComment = await commentRepository.create({
        pageId: BigInt(1),
        userId: BigInt(1),
        content: 'Parent Comment',
      });

      const childComment = await commentRepository.create({
        pageId: BigInt(1),
        userId: BigInt(1),
        content: 'Child Comment',
        parentCommentId: parentComment.id,
      });

      expect(childComment.parentCommentId).toBe(parentComment.id);
    });

    it('should have default values', async () => {
      const comment = await commentRepository.create({
        pageId: BigInt(1),
        userId: BigInt(1),
        content: 'Default Comment',
      });

      expect(comment.isResolved).toBe(false);
      expect(comment.resolvedById).toBeNull();
      expect(comment.resolvedAt).toBeNull();
      expect(comment.parentCommentId).toBeNull();
      expect(comment.blockId).toBeNull();
      expect(comment.deletedAt).toBeNull();
      expect(comment.mentions).toBeDefined();
      expect(Array.isArray(comment.mentions)).toBe(true);
    });

    it('should update comment', async () => {
      const created = await commentRepository.create({
        pageId: BigInt(1),
        userId: BigInt(1),
        content: 'Update Test Comment',
      });

      const updated = await commentRepository.update(created.id, {
        content: 'Updated Comment Content',
        mentions: ['user-uuid-1'],
      });

      expect(updated.content).toBe('Updated Comment Content');
      expect(updated.mentions).toEqual(['user-uuid-1']);
    });

    it('should find comments by block ID', async () => {
      const blockId = BigInt(1);
      
      await commentRepository.create({
        pageId: BigInt(1),
        userId: BigInt(1),
        content: 'Block Comment 1',
        blockId,
      });

      await commentRepository.create({
        pageId: BigInt(1),
        userId: BigInt(1),
        content: 'Block Comment 2',
        blockId,
      });

      const comments = await commentRepository.findByBlockId(blockId);

      expect(comments.length).toBeGreaterThanOrEqual(2);
      expect(comments.every(c => c.blockId === blockId)).toBe(true);
    });

    it('should find child comments by parent comment ID', async () => {
      const parent = await commentRepository.create({
        pageId: BigInt(1),
        userId: BigInt(1),
        content: 'Parent',
      });

      await commentRepository.create({
        pageId: BigInt(1),
        userId: BigInt(1),
        content: 'Child 1',
        parentCommentId: parent.id,
      });

      await commentRepository.create({
        pageId: BigInt(1),
        userId: BigInt(1),
        content: 'Child 2',
        parentCommentId: parent.id,
      });

      const parentWithChildren = await commentRepository.findById(parent.id);
      expect(parentWithChildren?.childComments).toBeDefined();
      expect(parentWithChildren?.childComments.length).toBeGreaterThanOrEqual(2);
    });

    it('should resolve and unresolve comment', async () => {
      const comment = await commentRepository.create({
        pageId: BigInt(1),
        userId: BigInt(1),
        content: 'Resolvable Comment',
      });

      // Resolve
      const resolved = await commentRepository.update(comment.id, {
        isResolved: true,
        resolvedById: BigInt(1),
        resolvedAt: new Date(),
      });

      expect(resolved.isResolved).toBe(true);
      expect(resolved.resolvedById).toBeDefined();
      expect(resolved.resolvedAt).toBeDefined();

      // Unresolve
      const unresolved = await commentRepository.update(comment.id, {
        isResolved: false,
        resolvedById: null,
        resolvedAt: null,
      });

      expect(unresolved.isResolved).toBe(false);
      expect(unresolved.resolvedById).toBeNull();
      expect(unresolved.resolvedAt).toBeNull();
    });
  });
});

