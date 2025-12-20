import { UserRepository } from '../../../src/repositories/user.repository';
import { UserCreateInput } from '../../../src/models/user.model';

describe('User Model', () => {
  let userRepository: UserRepository;

  beforeEach(() => {
    userRepository = new UserRepository();
  });

  describe('UserRepository', () => {
    it('should create a user with required fields', async () => {
      const userData: UserCreateInput = {
        email: 'test@example.com',
        passwordHash: 'hashed_password_123',
        name: 'Test User',
      };

      const user = await userRepository.create(userData);

      expect(user).toBeDefined();
      expect(user.email).toBe(userData.email);
      expect(user.name).toBe(userData.name);
      expect(user.passwordHash).toBe(userData.passwordHash);
      expect(user.uuid).toBeDefined();
      expect(user.isActive).toBe(true);
      expect(user.createdAt).toBeDefined();
      expect(user.updatedAt).toBeDefined();
    });

    it('should create a user with optional fields', async () => {
      const userData: UserCreateInput = {
        email: 'test2@example.com',
        passwordHash: 'hashed_password_123',
        name: 'Test User 2',
        avatarUrl: 'https://example.com/avatar.jpg',
        timezone: 'America/New_York',
        locale: 'en-US',
      };

      const user = await userRepository.create(userData);

      expect(user.avatarUrl).toBe(userData.avatarUrl);
      expect(user.timezone).toBe(userData.timezone);
      expect(user.locale).toBe(userData.locale);
    });

    it('should find user by email', async () => {
      const userData: UserCreateInput = {
        email: 'findme@example.com',
        passwordHash: 'hashed_password_123',
        name: 'Find Me User',
      };

      await userRepository.create(userData);
      const found = await userRepository.findByEmail(userData.email);

      expect(found).toBeDefined();
      expect(found?.email).toBe(userData.email);
    });

    it('should return null when user not found by email', async () => {
      const found = await userRepository.findByEmail('nonexistent@example.com');
      expect(found).toBeNull();
    });

    it('should find user by UUID', async () => {
      const userData: UserCreateInput = {
        email: 'uuidtest@example.com',
        passwordHash: 'hashed_password_123',
        name: 'UUID Test User',
      };

      const created = await userRepository.create(userData);
      const found = await userRepository.findByUuid(created.uuid);

      expect(found).toBeDefined();
      expect(found?.uuid).toBe(created.uuid);
    });

    it('should update user', async () => {
      const userData: UserCreateInput = {
        email: 'updatetest@example.com',
        passwordHash: 'hashed_password_123',
        name: 'Update Test User',
      };

      const created = await userRepository.create(userData);
      const updated = await userRepository.update(created.id, {
        name: 'Updated Name',
        avatarUrl: 'https://example.com/new-avatar.jpg',
      });

      expect(updated.name).toBe('Updated Name');
      expect(updated.avatarUrl).toBe('https://example.com/new-avatar.jpg');
    });

    it('should enforce unique email constraint', async () => {
      const userData: UserCreateInput = {
        email: 'unique@example.com',
        passwordHash: 'hashed_password_123',
        name: 'Unique User',
      };

      await userRepository.create(userData);

      await expect(
        userRepository.create({
          ...userData,
          name: 'Different Name',
        })
      ).rejects.toThrow();
    });

    it('should have default preferences as empty object', async () => {
      const userData: UserCreateInput = {
        email: 'prefs@example.com',
        passwordHash: 'hashed_password_123',
        name: 'Prefs User',
      };

      const user = await userRepository.create(userData);

      expect(user.preferences).toBeDefined();
      expect(typeof user.preferences).toBe('object');
    });
  });
});

