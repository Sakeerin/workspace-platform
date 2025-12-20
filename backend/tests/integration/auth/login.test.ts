import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import * as request from 'supertest';
import { AppModule } from '../../../src/app.module';
import { PrismaClient } from '@prisma/client';
import { EncryptionService } from '../../../src/utils/encryption';

describe('Auth Login (Integration)', () => {
  let app: INestApplication;
  let prisma: PrismaClient;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    app.useGlobalPipes(
      new ValidationPipe({
        whitelist: true,
        forbidNonWhitelisted: true,
        transform: true,
      })
    );
    app.setGlobalPrefix('api/v1');

    await app.init();
    prisma = new PrismaClient();
  });

  afterAll(async () => {
    await prisma.user.deleteMany({
      where: {
        email: {
          contains: 'test-login',
        },
      },
    });
    await prisma.$disconnect();
    await app.close();
  });

  beforeEach(async () => {
    // Clean up and create test user
    await prisma.user.deleteMany({
      where: {
        email: {
          contains: 'test-login',
        },
      },
    });

    // Create a test user for login tests
    const passwordHash = await EncryptionService.hashPassword('password123');
    await prisma.user.create({
      data: {
        email: 'test-login@example.com',
        passwordHash,
        name: 'Test Login User',
        isActive: true,
      },
    });
  });

  describe('POST /api/v1/auth/login', () => {
    it('should login successfully with correct credentials', async () => {
      const loginData = {
        email: 'test-login@example.com',
        password: 'password123',
      };

      const response = await request(app.getHttpServer())
        .post('/api/v1/auth/login')
        .send(loginData)
        .expect(200);

      expect(response.body).toHaveProperty('success', true);
      expect(response.body.data).toHaveProperty('user');
      expect(response.body.data).toHaveProperty('tokens');
      expect(response.body.data.user.email).toBe(loginData.email);
      expect(response.body.data.tokens).toHaveProperty('access_token');
      expect(response.body.data.tokens).toHaveProperty('refresh_token');

      // Verify last login was updated
      const user = await prisma.user.findUnique({
        where: { email: loginData.email },
      });
      expect(user?.lastLoginAt).toBeDefined();
    });

    it('should fail with incorrect password', async () => {
      const loginData = {
        email: 'test-login@example.com',
        password: 'wrongpassword',
      };

      const response = await request(app.getHttpServer())
        .post('/api/v1/auth/login')
        .send(loginData)
        .expect(401);

      expect(response.body.success).toBe(false);
      expect(response.body.error.message).toContain('Invalid credentials');
    });

    it('should fail with non-existent email', async () => {
      const loginData = {
        email: 'nonexistent@example.com',
        password: 'password123',
      };

      const response = await request(app.getHttpServer())
        .post('/api/v1/auth/login')
        .send(loginData)
        .expect(401);

      expect(response.body.success).toBe(false);
      expect(response.body.error.message).toContain('Invalid credentials');
    });

    it('should fail with invalid email format', async () => {
      const loginData = {
        email: 'invalid-email',
        password: 'password123',
      };

      const response = await request(app.getHttpServer())
        .post('/api/v1/auth/login')
        .send(loginData)
        .expect(400);

      expect(response.body.success).toBe(false);
    });

    it('should fail with missing password', async () => {
      const loginData = {
        email: 'test-login@example.com',
      };

      const response = await request(app.getHttpServer())
        .post('/api/v1/auth/login')
        .send(loginData)
        .expect(400);

      expect(response.body.success).toBe(false);
    });

    it('should fail when user is inactive', async () => {
      // Create inactive user
      const passwordHash = await EncryptionService.hashPassword('password123');
      await prisma.user.create({
        data: {
          email: 'test-login-inactive@example.com',
          passwordHash,
          name: 'Inactive User',
          isActive: false,
        },
      });

      const loginData = {
        email: 'test-login-inactive@example.com',
        password: 'password123',
      };

      const response = await request(app.getHttpServer())
        .post('/api/v1/auth/login')
        .send(loginData)
        .expect(401);

      expect(response.body.success).toBe(false);
      expect(response.body.error.message).toContain('Invalid credentials');
    });

    it('should update last login timestamp on successful login', async () => {
      const loginData = {
        email: 'test-login@example.com',
        password: 'password123',
      };

      const userBefore = await prisma.user.findUnique({
        where: { email: loginData.email },
      });

      await request(app.getHttpServer())
        .post('/api/v1/auth/login')
        .send(loginData)
        .expect(200);

      const userAfter = await prisma.user.findUnique({
        where: { email: loginData.email },
      });

      expect(userAfter?.lastLoginAt).toBeDefined();
      if (userBefore?.lastLoginAt) {
        expect(new Date(userAfter!.lastLoginAt!).getTime()).toBeGreaterThan(
          new Date(userBefore.lastLoginAt).getTime()
        );
      }
    });

    it('should return JWT tokens with correct structure', async () => {
      const loginData = {
        email: 'test-login@example.com',
        password: 'password123',
      };

      const response = await request(app.getHttpServer())
        .post('/api/v1/auth/login')
        .send(loginData)
        .expect(200);

      const { access_token, refresh_token } = response.body.data.tokens;

      expect(access_token).toBeDefined();
      expect(typeof access_token).toBe('string');
      expect(access_token.length).toBeGreaterThan(0);

      expect(refresh_token).toBeDefined();
      expect(typeof refresh_token).toBe('string');
      expect(refresh_token.length).toBeGreaterThan(0);
    });
  });
});

