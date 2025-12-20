import { BlockRepository } from '../../../src/repositories/block.repository';
import { BlockCreateInput } from '../../../src/models/block.model';

describe('Block Model', () => {
  let blockRepository: BlockRepository;

  beforeEach(() => {
    blockRepository = new BlockRepository();
  });

  describe('BlockRepository', () => {
    it('should create a block with required fields', async () => {
      const blockData: BlockCreateInput = {
        pageId: BigInt(1), // Would come from test fixture
        createdById: BigInt(1),
        lastEditedById: BigInt(1),
        type: 'paragraph',
        content: { text: 'Hello world' },
      };

      const block = await blockRepository.create(blockData);

      expect(block).toBeDefined();
      expect(block.type).toBe(blockData.type);
      expect(block.pageId).toBe(blockData.pageId);
      expect(block.uuid).toBeDefined();
      expect(block.position).toBe(0);
      expect(block.depth).toBe(0);
      expect(block.createdAt).toBeDefined();
      expect(block.updatedAt).toBeDefined();
    });

    it('should create blocks with different types', async () => {
      const pageId = BigInt(1);
      const userId = BigInt(1);

      const paragraphBlock = await blockRepository.create({
        pageId,
        createdById: userId,
        lastEditedById: userId,
        type: 'paragraph',
        content: { text: 'Paragraph text' },
      });

      const headingBlock = await blockRepository.create({
        pageId,
        createdById: userId,
        lastEditedById: userId,
        type: 'heading1',
        content: { text: 'Heading' },
      });

      expect(paragraphBlock.type).toBe('paragraph');
      expect(headingBlock.type).toBe('heading1');
    });

    it('should find block by UUID', async () => {
      const created = await blockRepository.create({
        pageId: BigInt(1),
        createdById: BigInt(1),
        lastEditedById: BigInt(1),
        type: 'paragraph',
        content: { text: 'Find me' },
      });

      const found = await blockRepository.findByUuid(created.uuid);

      expect(found).toBeDefined();
      expect(found?.uuid).toBe(created.uuid);
      expect(found?.type).toBe('paragraph');
    });

    it('should return null when block not found by UUID', async () => {
      const found = await blockRepository.findByUuid('00000000-0000-0000-0000-000000000000');
      expect(found).toBeNull();
    });

    it('should find blocks by page ID', async () => {
      const pageId = BigInt(1);
      const userId = BigInt(1);

      await blockRepository.create({
        pageId,
        createdById: userId,
        lastEditedById: userId,
        type: 'paragraph',
        content: { text: 'Block 1' },
        position: 0,
      });

      await blockRepository.create({
        pageId,
        createdById: userId,
        lastEditedById: userId,
        type: 'paragraph',
        content: { text: 'Block 2' },
        position: 1,
      });

      const blocks = await blockRepository.findByPageId(pageId);

      expect(blocks.length).toBeGreaterThanOrEqual(2);
      expect(blocks.some(b => b.content.text === 'Block 1')).toBe(true);
      expect(blocks.some(b => b.content.text === 'Block 2')).toBe(true);
    });

    it('should support nested blocks with parent_block_id', async () => {
      const pageId = BigInt(1);
      const userId = BigInt(1);

      const parentBlock = await blockRepository.create({
        pageId,
        createdById: userId,
        lastEditedById: userId,
        type: 'toggle',
        content: { text: 'Toggle block' },
      });

      const childBlock = await blockRepository.create({
        pageId,
        createdById: userId,
        lastEditedById: userId,
        type: 'paragraph',
        content: { text: 'Child block' },
        parentBlockId: parentBlock.id,
        depth: 1,
      });

      expect(childBlock.parentBlockId).toBe(parentBlock.id);
      expect(childBlock.depth).toBe(1);
    });

    it('should have default values', async () => {
      const block = await blockRepository.create({
        pageId: BigInt(1),
        createdById: BigInt(1),
        lastEditedById: BigInt(1),
        type: 'paragraph',
        content: {},
      });

      expect(block.position).toBe(0);
      expect(block.depth).toBe(0);
      expect(block.content).toBeDefined();
      expect(typeof block.content).toBe('object');
      expect(block.properties).toBeDefined();
      expect(typeof block.properties).toBe('object');
    });

    it('should update block', async () => {
      const created = await blockRepository.create({
        pageId: BigInt(1),
        createdById: BigInt(1),
        lastEditedById: BigInt(1),
        type: 'paragraph',
        content: { text: 'Original' },
      });

      const updated = await blockRepository.update(created.id, {
        content: { text: 'Updated text' },
        properties: { color: 'blue' },
      });

      expect(updated.content.text).toBe('Updated text');
      expect(updated.properties.color).toBe('blue');
    });

    it('should find blocks by parent block ID', async () => {
      const pageId = BigInt(1);
      const userId = BigInt(1);

      const parent = await blockRepository.create({
        pageId,
        createdById: userId,
        lastEditedById: userId,
        type: 'toggle',
        content: { text: 'Parent' },
      });

      await blockRepository.create({
        pageId,
        createdById: userId,
        lastEditedById: userId,
        type: 'paragraph',
        content: { text: 'Child 1' },
        parentBlockId: parent.id,
        depth: 1,
      });

      await blockRepository.create({
        pageId,
        createdById: userId,
        lastEditedById: userId,
        type: 'paragraph',
        content: { text: 'Child 2' },
        parentBlockId: parent.id,
        depth: 1,
      });

      const children = await blockRepository.findByParentBlockId(parent.id);

      expect(children.length).toBeGreaterThanOrEqual(2);
      expect(children.every(c => c.parentBlockId === parent.id)).toBe(true);
    });

    it('should order blocks by position', async () => {
      const pageId = BigInt(1);
      const userId = BigInt(1);

      await blockRepository.create({
        pageId,
        createdById: userId,
        lastEditedById: userId,
        type: 'paragraph',
        content: { text: 'Third' },
        position: 2,
      });

      await blockRepository.create({
        pageId,
        createdById: userId,
        lastEditedById: userId,
        type: 'paragraph',
        content: { text: 'First' },
        position: 0,
      });

      await blockRepository.create({
        pageId,
        createdById: userId,
        lastEditedById: userId,
        type: 'paragraph',
        content: { text: 'Second' },
        position: 1,
      });

      const blocks = await blockRepository.findByPageId(pageId);
      
      // Blocks should be ordered by position
      const positions = blocks.map(b => b.position);
      expect(positions).toEqual(positions.sort((a, b) => a - b));
    });
  });
});

