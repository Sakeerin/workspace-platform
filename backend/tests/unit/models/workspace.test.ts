import { WorkspaceRepository } from '../../../src/repositories/workspace.repository';
import { WorkspaceCreateInput } from '../../../src/models/workspace.model';

describe('Workspace Model', () => {
  let workspaceRepository: WorkspaceRepository;

  beforeEach(() => {
    workspaceRepository = new WorkspaceRepository();
  });

  describe('WorkspaceRepository', () => {
    it('should create a workspace with required fields', async () => {
      const workspaceData: WorkspaceCreateInput = {
        name: 'Test Workspace',
        slug: 'test-workspace',
      };

      const workspace = await workspaceRepository.create(workspaceData);

      expect(workspace).toBeDefined();
      expect(workspace.name).toBe(workspaceData.name);
      expect(workspace.slug).toBe(workspaceData.slug);
      expect(workspace.uuid).toBeDefined();
      expect(workspace.plan).toBe('free');
      expect(workspace.isActive).toBe(true);
      expect(workspace.createdAt).toBeDefined();
      expect(workspace.updatedAt).toBeDefined();
    });

    it('should create a workspace with optional fields', async () => {
      const workspaceData: WorkspaceCreateInput = {
        name: 'Advanced Workspace',
        slug: 'advanced-workspace',
        icon: '🚀',
        coverImage: 'https://example.com/cover.jpg',
        plan: 'team',
        maxMembers: 50,
        maxStorageGb: 100,
      };

      const workspace = await workspaceRepository.create(workspaceData);

      expect(workspace.icon).toBe(workspaceData.icon);
      expect(workspace.coverImage).toBe(workspaceData.coverImage);
      expect(workspace.plan).toBe(workspaceData.plan);
      expect(workspace.maxMembers).toBe(workspaceData.maxMembers);
      expect(workspace.maxStorageGb).toBe(workspaceData.maxStorageGb);
    });

    it('should find workspace by slug', async () => {
      const workspaceData: WorkspaceCreateInput = {
        name: 'Find Me Workspace',
        slug: 'find-me-workspace',
      };

      await workspaceRepository.create(workspaceData);
      const found = await workspaceRepository.findBySlug(workspaceData.slug);

      expect(found).toBeDefined();
      expect(found?.slug).toBe(workspaceData.slug);
    });

    it('should return null when workspace not found by slug', async () => {
      const found = await workspaceRepository.findBySlug('nonexistent-slug');
      expect(found).toBeNull();
    });

    it('should find workspace by UUID', async () => {
      const workspaceData: WorkspaceCreateInput = {
        name: 'UUID Test Workspace',
        slug: 'uuid-test-workspace',
      };

      const created = await workspaceRepository.create(workspaceData);
      const found = await workspaceRepository.findByUuid(created.uuid);

      expect(found).toBeDefined();
      expect(found?.uuid).toBe(created.uuid);
    });

    it('should update workspace', async () => {
      const workspaceData: WorkspaceCreateInput = {
        name: 'Update Test Workspace',
        slug: 'update-test-workspace',
      };

      const created = await workspaceRepository.create(workspaceData);
      const updated = await workspaceRepository.update(created.id, {
        name: 'Updated Workspace Name',
        icon: '⭐',
        plan: 'enterprise',
      });

      expect(updated.name).toBe('Updated Workspace Name');
      expect(updated.icon).toBe('⭐');
      expect(updated.plan).toBe('enterprise');
    });

    it('should enforce unique slug constraint', async () => {
      const workspaceData: WorkspaceCreateInput = {
        name: 'Unique Workspace',
        slug: 'unique-slug',
      };

      await workspaceRepository.create(workspaceData);

      await expect(
        workspaceRepository.create({
          name: 'Different Name',
          slug: 'unique-slug',
        })
      ).rejects.toThrow();
    });

    it('should have default settings as empty object', async () => {
      const workspaceData: WorkspaceCreateInput = {
        name: 'Settings Workspace',
        slug: 'settings-workspace',
      };

      const workspace = await workspaceRepository.create(workspaceData);

      expect(workspace.settings).toBeDefined();
      expect(typeof workspace.settings).toBe('object');
    });

    it('should have default plan as free', async () => {
      const workspaceData: WorkspaceCreateInput = {
        name: 'Default Plan Workspace',
        slug: 'default-plan-workspace',
      };

      const workspace = await workspaceRepository.create(workspaceData);

      expect(workspace.plan).toBe('free');
    });

    it('should have default max members and storage', async () => {
      const workspaceData: WorkspaceCreateInput = {
        name: 'Limits Workspace',
        slug: 'limits-workspace',
      };

      const workspace = await workspaceRepository.create(workspaceData);

      expect(workspace.maxMembers).toBe(10);
      expect(workspace.maxStorageGb).toBe(5);
    });
  });
});

