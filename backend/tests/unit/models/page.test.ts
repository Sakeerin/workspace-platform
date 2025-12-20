import { PageRepository } from '../../../src/repositories/page.repository';
import { PageCreateInput } from '../../../src/models/page.model';

describe('Page Model', () => {
  let pageRepository: PageRepository;

  beforeEach(() => {
    pageRepository = new PageRepository();
  });

  describe('PageRepository', () => {
    it('should create a page with required fields', async () => {
      // This test requires test setup (workspace and user)
      // In practice, use test fixtures or database seeding
      const pageData: PageCreateInput = {
        workspaceId: BigInt(1), // Would come from test fixture
        createdById: BigInt(1),
        lastEditedById: BigInt(1),
        title: 'Test Page',
      };

      const page = await pageRepository.create(pageData);

      expect(page).toBeDefined();
      expect(page.title).toBe(pageData.title);
      expect(page.workspaceId).toBe(pageData.workspaceId);
      expect(page.uuid).toBeDefined();
      expect(page.type).toBe('page');
      expect(page.visibility).toBe('workspace');
      expect(page.createdAt).toBeDefined();
      expect(page.updatedAt).toBeDefined();
    });

    it('should create a page with optional fields', async () => {
      const pageData: PageCreateInput = {
        workspaceId: BigInt(1),
        createdById: BigInt(1),
        lastEditedById: BigInt(1),
        title: 'Advanced Page',
        icon: '📄',
        coverImage: 'https://example.com/cover.jpg',
        type: 'page',
        visibility: 'private',
      };

      const page = await pageRepository.create(pageData);

      expect(page.icon).toBe(pageData.icon);
      expect(page.coverImage).toBe(pageData.coverImage);
      expect(page.visibility).toBe(pageData.visibility);
    });

    it('should find page by UUID', async () => {
      const created = await pageRepository.create({
        workspaceId: BigInt(1),
        createdById: BigInt(1),
        lastEditedById: BigInt(1),
        title: 'Find Me Page',
      });

      const found = await pageRepository.findByUuid(created.uuid);

      expect(found).toBeDefined();
      expect(found?.uuid).toBe(created.uuid);
      expect(found?.title).toBe('Find Me Page');
    });

    it('should return null when page not found by UUID', async () => {
      const found = await pageRepository.findByUuid('00000000-0000-0000-0000-000000000000');
      expect(found).toBeNull();
    });

    it('should find pages by workspace ID', async () => {
      const workspaceId = BigInt(1);
      
      await pageRepository.create({
        workspaceId,
        createdById: BigInt(1),
        lastEditedById: BigInt(1),
        title: 'Page 1',
      });

      await pageRepository.create({
        workspaceId,
        createdById: BigInt(1),
        lastEditedById: BigInt(1),
        title: 'Page 2',
      });

      const pages = await pageRepository.findByWorkspaceId(workspaceId);

      expect(pages.length).toBeGreaterThanOrEqual(2);
      expect(pages.some(p => p.title === 'Page 1')).toBe(true);
      expect(pages.some(p => p.title === 'Page 2')).toBe(true);
    });

    it('should support hierarchical pages with parent_id', async () => {
      const parentPage = await pageRepository.create({
        workspaceId: BigInt(1),
        createdById: BigInt(1),
        lastEditedById: BigInt(1),
        title: 'Parent Page',
      });

      const childPage = await pageRepository.create({
        workspaceId: BigInt(1),
        createdById: BigInt(1),
        lastEditedById: BigInt(1),
        title: 'Child Page',
        parentId: parentPage.id,
      });

      expect(childPage.parentId).toBe(parentPage.id);
    });

    it('should have default values', async () => {
      const page = await pageRepository.create({
        workspaceId: BigInt(1),
        createdById: BigInt(1),
        lastEditedById: BigInt(1),
        title: 'Default Page',
      });

      expect(page.type).toBe('page');
      expect(page.visibility).toBe('workspace');
      expect(page.isArchived).toBe(false);
      expect(page.isFavorite).toBe(false);
      expect(page.isLocked).toBe(false);
      expect(page.allowComments).toBe(true);
      expect(page.allowDuplicate).toBe(true);
      expect(page.position).toBe(0);
      expect(page.content).toBeDefined();
      expect(typeof page.content).toBe('object');
    });

    it('should update page', async () => {
      const created = await pageRepository.create({
        workspaceId: BigInt(1),
        createdById: BigInt(1),
        lastEditedById: BigInt(1),
        title: 'Update Test Page',
      });

      const updated = await pageRepository.update(created.id, {
        title: 'Updated Title',
        icon: '⭐',
        isFavorite: true,
        visibility: 'private',
      });

      expect(updated.title).toBe('Updated Title');
      expect(updated.icon).toBe('⭐');
      expect(updated.isFavorite).toBe(true);
      expect(updated.visibility).toBe('private');
    });

    it('should find pages by parent ID', async () => {
      const parent = await pageRepository.create({
        workspaceId: BigInt(1),
        createdById: BigInt(1),
        lastEditedById: BigInt(1),
        title: 'Parent',
      });

      await pageRepository.create({
        workspaceId: BigInt(1),
        createdById: BigInt(1),
        lastEditedById: BigInt(1),
        title: 'Child 1',
        parentId: parent.id,
      });

      await pageRepository.create({
        workspaceId: BigInt(1),
        createdById: BigInt(1),
        lastEditedById: BigInt(1),
        title: 'Child 2',
        parentId: parent.id,
      });

      const children = await pageRepository.findByParentId(parent.id);

      expect(children.length).toBeGreaterThanOrEqual(2);
      expect(children.every(c => c.parentId === parent.id)).toBe(true);
    });
  });
});
