import { DatabaseRowRepository } from '../../../src/repositories/database-row.repository';
import { DatabaseRowCreateInput } from '../../../src/models/database-row.model';

describe('DatabaseRow Model', () => {
  let databaseRowRepository: DatabaseRowRepository;

  beforeEach(() => {
    databaseRowRepository = new DatabaseRowRepository();
  });

  describe('DatabaseRowRepository', () => {
    it('should create a database row with required fields', async () => {
      // This test requires test setup (database and user)
      // In practice, use test fixtures or database seeding
      const rowData: DatabaseRowCreateInput = {
        databaseId: BigInt(1), // Would come from test fixture
        createdById: BigInt(1), // Would come from test fixture
        lastEditedById: BigInt(1), // Would come from test fixture
        properties: {},
        position: 0,
      };

      const row = await databaseRowRepository.create(rowData);

      expect(row).toBeDefined();
      expect(row.databaseId).toBe(rowData.databaseId);
      expect(row.uuid).toBeDefined();
      expect(row.properties).toBeDefined();
      expect(row.position).toBe(rowData.position);
      expect(row.createdAt).toBeDefined();
      expect(row.updatedAt).toBeDefined();
    });

    it('should create a database row with optional fields', async () => {
      const rowData: DatabaseRowCreateInput = {
        databaseId: BigInt(1),
        createdById: BigInt(1),
        lastEditedById: BigInt(1),
        pageId: BigInt(1),
        properties: {
          title: 'Test Row',
          status: 'Todo',
          assignee: 'user-123',
        },
        propertiesText: 'Test Row Todo user-123',
        position: 1,
      };

      const row = await databaseRowRepository.create(rowData);

      expect(row.pageId).toBe(rowData.pageId);
      expect(row.properties).toEqual(rowData.properties);
      expect(row.propertiesText).toBe(rowData.propertiesText);
      expect(row.position).toBe(rowData.position);
    });

    it('should find row by UUID', async () => {
      const created = await databaseRowRepository.create({
        databaseId: BigInt(1),
        createdById: BigInt(1),
        lastEditedById: BigInt(1),
        properties: {},
        position: 0,
      });

      const found = await databaseRowRepository.findByUuid(created.uuid);

      expect(found).toBeDefined();
      expect(found?.uuid).toBe(created.uuid);
      expect(found?.databaseId).toBe(created.databaseId);
    });

    it('should return null when row not found by UUID', async () => {
      const found = await databaseRowRepository.findByUuid('00000000-0000-0000-0000-000000000000');
      expect(found).toBeNull();
    });

    it('should find rows by database ID', async () => {
      const databaseId = BigInt(1);
      
      await databaseRowRepository.create({
        databaseId,
        createdById: BigInt(1),
        lastEditedById: BigInt(1),
        properties: { title: 'Row 1' },
        position: 0,
      });

      await databaseRowRepository.create({
        databaseId,
        createdById: BigInt(1),
        lastEditedById: BigInt(1),
        properties: { title: 'Row 2' },
        position: 1,
      });

      const rows = await databaseRowRepository.findByDatabaseId(databaseId);

      expect(rows.length).toBeGreaterThanOrEqual(2);
      expect(rows.some(r => r.properties.title === 'Row 1')).toBe(true);
      expect(rows.some(r => r.properties.title === 'Row 2')).toBe(true);
    });

    it('should find rows by page ID', async () => {
      const pageId = BigInt(1);
      
      await databaseRowRepository.create({
        databaseId: BigInt(1),
        pageId,
        createdById: BigInt(1),
        lastEditedById: BigInt(1),
        properties: { title: 'Page Row' },
        position: 0,
      });

      const rows = await databaseRowRepository.findByPageId(pageId);

      expect(rows.length).toBeGreaterThanOrEqual(1);
      expect(rows.some(r => r.pageId === pageId)).toBe(true);
    });

    it('should have default values', async () => {
      const row = await databaseRowRepository.create({
        databaseId: BigInt(1),
        createdById: BigInt(1),
        lastEditedById: BigInt(1),
        properties: {},
        position: 0,
      });

      expect(row.properties).toBeDefined();
      expect(typeof row.properties).toBe('object');
      expect(row.position).toBe(0);
      expect(row.deletedAt).toBeNull();
    });

    it('should update row', async () => {
      const created = await databaseRowRepository.create({
        databaseId: BigInt(1),
        createdById: BigInt(1),
        lastEditedById: BigInt(1),
        properties: { title: 'Original' },
        position: 0,
      });

      const updated = await databaseRowRepository.update(created.id, {
        properties: { title: 'Updated', status: 'Done' },
        propertiesText: 'Updated Done',
        position: 1,
      });

      expect(updated.properties.title).toBe('Updated');
      expect(updated.properties.status).toBe('Done');
      expect(updated.propertiesText).toBe('Updated Done');
      expect(updated.position).toBe(1);
    });

    it('should update row position', async () => {
      const row1 = await databaseRowRepository.create({
        databaseId: BigInt(1),
        createdById: BigInt(1),
        lastEditedById: BigInt(1),
        properties: { title: 'Row 1' },
        position: 0,
      });

      const row2 = await databaseRowRepository.create({
        databaseId: BigInt(1),
        createdById: BigInt(1),
        lastEditedById: BigInt(1),
        properties: { title: 'Row 2' },
        position: 1,
      });

      // Swap positions
      await databaseRowRepository.update(row1.id, { position: 1 });
      await databaseRowRepository.update(row2.id, { position: 0 });

      const updated1 = await databaseRowRepository.findByUuid(row1.uuid);
      const updated2 = await databaseRowRepository.findByUuid(row2.uuid);

      expect(updated1?.position).toBe(1);
      expect(updated2?.position).toBe(0);
    });

    it('should support soft delete', async () => {
      const created = await databaseRowRepository.create({
        databaseId: BigInt(1),
        createdById: BigInt(1),
        lastEditedById: BigInt(1),
        properties: { title: 'To Delete' },
        position: 0,
      });

      await databaseRowRepository.softDelete(created.id);

      const found = await databaseRowRepository.findByUuid(created.uuid);
      expect(found?.deletedAt).toBeDefined();
      expect(found?.deletedAt).not.toBeNull();
    });
  });
});

