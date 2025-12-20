import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import * as request from 'supertest';
import { AppModule } from '../../../src/app.module';
import { PrismaClient } from '@prisma/client';
import { EncryptionService } from '../../../src/utils/encryption';

/**
 * Contract tests for POST /api/v1/auth/login
 * These tests verify that the API implementation matches the OpenAPI specification
 */
describe('POST /api/v1/auth/login - Contract Tests', () => {
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
          contains: 'test-contract-login',
        },
      },
    });
    await prisma.$disconnect();
    await app.close();
  });

  beforeEach(async () => {
    await prisma.user.deleteMany({
      where: {
        email: {
          contains: 'test-contract-login',
        },
      },
    });

    // Create test user for login tests
    const passwordHash = await EncryptionService.hashPassword('password123');
    await prisma.user.create({
      data: {
        email: 'test-contract-login@example.com',
        passwordHash,
        name: 'Contract Test Login User',
        isActive: true,
      },
    });
  });

  describe('Request Contract', () => {
    it('should accept valid request body according to OpenAPI spec', async () => {
      const requestBody = {
        email: 'test-contract-login@example.com',
        password: 'password123',
      };

      const response = await request(app.getHttpServer())
        .post('/api/v1/auth/login')
        .send(requestBody)
        .expect(200);

      expect(response.body).toHaveProperty('success');
    });

    it('should reject request with missing required field: email', async () => {
      const requestBody = {
        password: 'password123',
      };

      const response = await request(app.getHttpServer())
        .post('/api/v1/auth/login')
        .send(requestBody)
        .expect(400);

      expect(response.body.success).toBe(false);
    });

    it('should reject request with missing required field: password', async () => {
      const requestBody = {
        email: 'test-contract-login@example.com',
      };

      const response = await request(app.getHttpServer())
        .post('/api/v1/auth/login')
        .send(requestBody)
        .expect(400);

      expect(response.body.success).toBe(false);
    });

    it('should validate email format', async () => {
      const requestBody = {
        email: 'invalid-email-format',
        password: 'password123',
      };

      const response = await request(app.getHttpServer())
        .post('/api/v1/auth/login')
        .send(requestBody)
        .expect(400);

      expect(response.body.success).toBe(false);
    });
  });

  describe('Response Contract - 200 OK', () => {
    it('should return 200 status code on successful login', async () => {
      const requestBody = {
        email: 'test-contract-login@example.com',
        password: 'password123',
      };

      const response = await request(app.getHttpServer())
        .post('/api/v1/auth/login')
        .send(requestBody)
        .expect(200);

      expect(response.status).toBe(200);
    });

    it('should return AuthResponse schema according to OpenAPI spec', async () => {
      const requestBody = {
        email: 'test-contract-login@example.com',
        password: 'password123',
      };

      const response = await request(app.getHttpServer())
        .post('/api/v1/auth/login')
        .send(requestBody)
        .expect(200);

      // Verify AuthResponse structure
      expect(response.body).toHaveProperty('success', true);
      expect(response.body).toHaveProperty('data');
      expect(response.body.data).toHaveProperty('user');
      expect(response.body.data).toHaveProperty('tokens');

      // Verify User schema
      const user = response.body.data.user;
      expect(user).toHaveProperty('uuid');
      expect(user).toHaveProperty('email');
      expect(user).toHaveProperty('name');
      expect(typeof user.uuid).toBe('string');
      expect(typeof user.email).toBe('string');
      expect(typeof user.name).toBe('string');

      // Verify tokens
      const tokens = response.body.data.tokens;
      expect(tokens).toHaveProperty('access_token');
      expect(tokens).toHaveProperty('refresh_token');
      expect(typeof tokens.access_token).toBe('string');
      expect(typeof tokens.refresh_token).toBe('string');
    });

    it('should return user email matching request', async () => {
      const requestBody = {
        email: 'test-contract-login@example.com',
        password: 'password123',
      };

      const response = await request(app.getHttpServer())
        .post('/api/v1/auth/login')
        .send(requestBody)
        .expect(200);

      expect(response.body.data.user.email).toBe(requestBody.email);
    });

    it('should return JWT tokens', async () => {
      const requestBody = {
        email: 'test-contract-login@example.com',
        password: 'password123',
      };

      const response = await request(app.getHttpServer())
        .post('/api/v1/auth/login')
        .send(requestBody)
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

  describe('Response Contract - 401 Unauthorized', () => {
    it('should return 401 for invalid credentials', async () => {
      const requestBody = {
        email: 'test-contract-login@example.com',
        password: 'wrongpassword',
      };

      const response = await request(app.getHttpServer())
        .post('/api/v1/auth/login')
        .send(requestBody)
        .expect(401);

      expect(response.status).toBe(401);
      expect(response.body).toHaveProperty('success', false);
      expect(response.body).toHaveProperty('error');
    });

    it('should return 401 for non-existent user', async () => {
      const requestBody = {
        email: 'nonexistent@example.com',
        password: 'password123',
      };

      const response = await request(app.getHttpServer())
        .post('/api/v1/auth/login')
        .send(requestBody)
        .expect(401);

      expect(response.status).toBe(401);
      expect(response.body.success).toBe(false);
    });

    it('should return error object with code and message', async () => {
      const requestBody = {
        email: 'test-contract-login@example.com',
        password: 'wrongpassword',
      };

      const response = await request(app.getHttpServer())
        .post('/api/v1/auth/login')
        .send(requestBody)
        .expect(401);

      expect(response.body.error).toHaveProperty('code');
      expect(response.body.error).toHaveProperty('message');
      expect(response.body.error.message).toContain('Invalid credentials');
    });
  });

  describe('Response Contract - 400 Bad Request', () => {
    it('should return 400 for invalid request body', async () => {
      const requestBody = {
        email: 'invalid-email',
        password: '',
      };

      const response = await request(app.getHttpServer())
        .post('/api/v1/auth/login')
        .send(requestBody)
        .expect(400);

      expect(response.status).toBe(400);
      expect(response.body).toHaveProperty('success', false);
      expect(response.body).toHaveProperty('error');
    });
  });

  describe('Content-Type Contract', () => {
    it('should accept application/json content type', async () => {
      const requestBody = {
        email: 'test-contract-login@example.com',
        password: 'password123',
      };

      const response = await request(app.getHttpServer())
        .post('/api/v1/auth/login')
        .set('Content-Type', 'application/json')
        .send(requestBody)
        .expect(200);

      expect(response.headers['content-type']).toMatch(/application\/json/);
    });
  });
});

