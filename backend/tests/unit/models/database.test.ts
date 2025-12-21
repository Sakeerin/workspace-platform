import { DatabaseRepository } from '../../../src/repositories/database.repository';
import { DatabaseCreateInput } from '../../../src/models/database.model';

describe('Database Model', () => {
  let databaseRepository: DatabaseRepository;

  beforeEach(() => {
    databaseRepository = new DatabaseRepository();
  });

  describe('DatabaseRepository', () => {
    it('should create a database with required fields', async () => {
      // This test requires test setup (workspace, page, and user)
      // In practice, use test fixtures or database seeding
      const databaseData: DatabaseCreateInput = {
        pageId: BigInt(1), // Would come from test fixture
        workspaceId: BigInt(1), // Would come from test fixture
        title: 'Test Database',
        properties: {},
        views: [],
      };

      const database = await databaseRepository.create(databaseData);

      expect(database).toBeDefined();
      expect(database.title).toBe(databaseData.title);
      expect(database.pageId).toBe(databaseData.pageId);
      expect(database.workspaceId).toBe(databaseData.workspaceId);
      expect(database.uuid).toBeDefined();
      expect(database.properties).toBeDefined();
      expect(Array.isArray(database.views)).toBe(true);
      expect(database.createdAt).toBeDefined();
      expect(database.updatedAt).toBeDefined();
    });

    it('should create a database with optional fields', async () => {
      const databaseData: DatabaseCreateInput = {
        pageId: BigInt(1),
        workspaceId: BigInt(1),
        title: 'Advanced Database',
        description: 'A test database',
        properties: {
          title: { type: 'title', name: 'Name' },
          status: { type: 'select', name: 'Status', options: ['Todo', 'Done'] },
        },
        views: [
          {
            id: 'view1',
            type: 'table',
            name: 'Table View',
            filters: [],
            sorts: [],
          },
        ],
        defaultViewId: 'view1',
      };

      const database = await databaseRepository.create(databaseData);

      expect(database.description).toBe(databaseData.description);
      expect(database.properties).toEqual(databaseData.properties);
      expect(database.views).toEqual(databaseData.views);
      expect(database.defaultViewId).toBe(databaseData.defaultViewId);
    });

    it('should find database by UUID', async () => {
      const created = await databaseRepository.create({
        pageId: BigInt(1),
        workspaceId: BigInt(1),
        title: 'Find Me Database',
        properties: {},
        views: [],
      });

      const found = await databaseRepository.findByUuid(created.uuid);

      expect(found).toBeDefined();
      expect(found?.uuid).toBe(created.uuid);
      expect(found?.title).toBe('Find Me Database');
    });

    it('should return null when database not found by UUID', async () => {
      const found = await databaseRepository.findByUuid('00000000-0000-0000-0000-000000000000');
      expect(found).toBeNull();
    });

    it('should find database by page ID', async () => {
      const pageId = BigInt(1);
      
      await databaseRepository.create({
        pageId,
        workspaceId: BigInt(1),
        title: 'Database 1',
        properties: {},
        views: [],
      });

      const found = await databaseRepository.findByPageId(pageId);

      expect(found).toBeDefined();
      expect(found?.pageId).toBe(pageId);
    });

    it('should find databases by workspace ID', async () => {
      const workspaceId = BigInt(1);
      
      await databaseRepository.create({
        pageId: BigInt(1),
        workspaceId,
        title: 'Database 1',
        properties: {},
        views: [],
      });

      await databaseRepository.create({
        pageId: BigInt(2),
        workspaceId,
        title: 'Database 2',
        properties: {},
        views: [],
      });

      const databases = await databaseRepository.findByWorkspaceId(workspaceId);

      expect(databases.length).toBeGreaterThanOrEqual(2);
      expect(databases.some(d => d.title === 'Database 1')).toBe(true);
      expect(databases.some(d => d.title === 'Database 2')).toBe(true);
    });

    it('should have default values', async () => {
      const database = await databaseRepository.create({
        pageId: BigInt(1),
        workspaceId: BigInt(1),
        title: 'Default Database',
        properties: {},
        views: [],
      });

      expect(database.properties).toBeDefined();
      expect(typeof database.properties).toBe('object');
      expect(Array.isArray(database.views)).toBe(true);
      expect(database.deletedAt).toBeNull();
    });

    it('should update database', async () => {
      const created = await databaseRepository.create({
        pageId: BigInt(1),
        workspaceId: BigInt(1),
        title: 'Update Test Database',
        properties: {},
        views: [],
      });

      const updated = await databaseRepository.update(created.id, {
        title: 'Updated Title',
        description: 'Updated description',
        defaultViewId: 'new-view',
      });

      expect(updated.title).toBe('Updated Title');
      expect(updated.description).toBe('Updated description');
      expect(updated.defaultViewId).toBe('new-view');
    });

    it('should update database properties', async () => {
      const created = await databaseRepository.create({
        pageId: BigInt(1),
        workspaceId: BigInt(1),
        title: 'Properties Test',
        properties: {
          title: { type: 'title', name: 'Name' },
        },
        views: [],
      });

      const newProperties = {
        title: { type: 'title', name: 'Name' },
        status: { type: 'select', name: 'Status', options: ['Todo', 'In Progress', 'Done'] },
        assignee: { type: 'person', name: 'Assignee' },
      };

      const updated = await databaseRepository.update(created.id, {
        properties: newProperties,
      });

      expect(updated.properties).toEqual(newProperties);
    });
  });
});

