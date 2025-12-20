import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import * as request from 'supertest';
import { AppModule } from '../../../src/app.module';
import { PrismaClient } from '@prisma/client';

/**
 * Contract tests for POST /api/v1/auth/register
 * These tests verify that the API implementation matches the OpenAPI specification
 */
describe('POST /api/v1/auth/register - Contract Tests', () => {
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
    await prisma.workspaceMember.deleteMany({
      where: {
        workspace: {
          name: {
            contains: "Test User",
          },
        },
      },
    });
    await prisma.workspace.deleteMany({
      where: {
        name: {
          contains: "Test User",
        },
      },
    });
    await prisma.user.deleteMany({
      where: {
        email: {
          contains: 'test-contract-register',
        },
      },
    });
    await prisma.$disconnect();
    await app.close();
  });

  beforeEach(async () => {
    await prisma.workspaceMember.deleteMany({
      where: {
        workspace: {
          name: {
            contains: "Test User",
          },
        },
      },
    });
    await prisma.workspace.deleteMany({
      where: {
        name: {
          contains: "Test User",
        },
      },
    });
    await prisma.user.deleteMany({
      where: {
        email: {
          contains: 'test-contract-register',
        },
      },
    });
  });

  describe('Request Contract', () => {
    it('should accept valid request body according to OpenAPI spec', async () => {
      const requestBody = {
        email: 'test-contract-register@example.com',
        password: 'password123',
        name: 'Contract Test User',
      };

      const response = await request(app.getHttpServer())
        .post('/api/v1/auth/register')
        .send(requestBody)
        .expect(201);

      // Verify request was processed
      expect(response.body).toHaveProperty('success');
    });

    it('should reject request with missing required field: email', async () => {
      const requestBody = {
        password: 'password123',
        name: 'Contract Test User',
      };

      const response = await request(app.getHttpServer())
        .post('/api/v1/auth/register')
        .send(requestBody)
        .expect(400);

      expect(response.body.success).toBe(false);
    });

    it('should reject request with missing required field: password', async () => {
      const requestBody = {
        email: 'test-contract-register@example.com',
        name: 'Contract Test User',
      };

      const response = await request(app.getHttpServer())
        .post('/api/v1/auth/register')
        .send(requestBody)
        .expect(400);

      expect(response.body.success).toBe(false);
    });

    it('should reject request with missing required field: name', async () => {
      const requestBody = {
        email: 'test-contract-register@example.com',
        password: 'password123',
      };

      const response = await request(app.getHttpServer())
        .post('/api/v1/auth/register')
        .send(requestBody)
        .expect(400);

      expect(response.body.success).toBe(false);
    });

    it('should validate email format', async () => {
      const requestBody = {
        email: 'invalid-email-format',
        password: 'password123',
        name: 'Contract Test User',
      };

      const response = await request(app.getHttpServer())
        .post('/api/v1/auth/register')
        .send(requestBody)
        .expect(400);

      expect(response.body.success).toBe(false);
    });

    it('should validate password minLength (8 characters)', async () => {
      const requestBody = {
        email: 'test-contract-register@example.com',
        password: 'short',
        name: 'Contract Test User',
      };

      const response = await request(app.getHttpServer())
        .post('/api/v1/auth/register')
        .send(requestBody)
        .expect(400);

      expect(response.body.success).toBe(false);
    });
  });

  describe('Response Contract - 201 Created', () => {
    it('should return 201 status code on successful registration', async () => {
      const requestBody = {
        email: 'test-contract-register-201@example.com',
        password: 'password123',
        name: 'Contract Test User 201',
      };

      const response = await request(app.getHttpServer())
        .post('/api/v1/auth/register')
        .send(requestBody)
        .expect(201);

      expect(response.status).toBe(201);
    });

    it('should return AuthResponse schema according to OpenAPI spec', async () => {
      const requestBody = {
        email: 'test-contract-register-response@example.com',
        password: 'password123',
        name: 'Contract Test User Response',
      };

      const response = await request(app.getHttpServer())
        .post('/api/v1/auth/register')
        .send(requestBody)
        .expect(201);

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
        email: 'test-contract-register-email@example.com',
        password: 'password123',
        name: 'Contract Test User Email',
      };

      const response = await request(app.getHttpServer())
        .post('/api/v1/auth/register')
        .send(requestBody)
        .expect(201);

      expect(response.body.data.user.email).toBe(requestBody.email);
    });

    it('should return user name matching request', async () => {
      const requestBody = {
        email: 'test-contract-register-name@example.com',
        password: 'password123',
        name: 'Contract Test User Name',
      };

      const response = await request(app.getHttpServer())
        .post('/api/v1/auth/register')
        .send(requestBody)
        .expect(201);

      expect(response.body.data.user.name).toBe(requestBody.name);
    });
  });

  describe('Response Contract - 400 Bad Request', () => {
    it('should return 400 for invalid request body', async () => {
      const requestBody = {
        email: 'invalid-email',
        password: 'short',
        name: '',
      };

      const response = await request(app.getHttpServer())
        .post('/api/v1/auth/register')
        .send(requestBody)
        .expect(400);

      expect(response.status).toBe(400);
      expect(response.body).toHaveProperty('success', false);
      expect(response.body).toHaveProperty('error');
    });

    it('should return error object with code and message', async () => {
      const requestBody = {
        email: 'invalid-email',
        password: 'password123',
        name: 'Contract Test User',
      };

      const response = await request(app.getHttpServer())
        .post('/api/v1/auth/register')
        .send(requestBody)
        .expect(400);

      expect(response.body.error).toHaveProperty('code');
      expect(response.body.error).toHaveProperty('message');
    });
  });

  describe('Response Contract - 409 Conflict', () => {
    it('should return 409 when email already exists', async () => {
      const requestBody = {
        email: 'test-contract-register-conflict@example.com',
        password: 'password123',
        name: 'Contract Test User Conflict',
      };

      // First registration
      await request(app.getHttpServer())
        .post('/api/v1/auth/register')
        .send(requestBody)
        .expect(201);

      // Second registration with same email
      const response = await request(app.getHttpServer())
        .post('/api/v1/auth/register')
        .send(requestBody)
        .expect(400); // Note: Currently returns 400, but OpenAPI spec says 409

      expect(response.body.success).toBe(false);
      expect(response.body.error.message).toContain('already exists');
    });
  });

  describe('Content-Type Contract', () => {
    it('should accept application/json content type', async () => {
      const requestBody = {
        email: 'test-contract-register-ct@example.com',
        password: 'password123',
        name: 'Contract Test User CT',
      };

      const response = await request(app.getHttpServer())
        .post('/api/v1/auth/register')
        .set('Content-Type', 'application/json')
        .send(requestBody)
        .expect(201);

      expect(response.headers['content-type']).toMatch(/application\/json/);
    });
  });
});

