import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import * as request from 'supertest';
import { AppModule } from '../../../src/app.module';
import { PrismaClient } from '@prisma/client';
import { EncryptionService } from '../../../src/utils/encryption';
import { JWTService } from '../../../src/utils/jwt';

/**
 * Contract tests for GET /api/v1/workspaces/:workspaceUuid/search
 * These tests verify that the API implementation matches the OpenAPI specification
 */
describe('GET /api/v1/workspaces/:workspaceUuid/search - Contract Tests', () => {
  let app: INestApplication;
  let prisma: PrismaClient;
  let accessToken: string;
  let workspaceUuid: string;

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

    // Create test user and workspace
    const passwordHash = await EncryptionService.hashPassword('password123');
    const user = await prisma.user.create({
      data: {
        email: 'test-contract-search@example.com',
        passwordHash,
        name: 'Contract Test User',
        isActive: true,
      },
    });

    const workspace = await prisma.workspace.create({
      data: {
        name: 'Contract Test Workspace',
        slug: 'contract-test-workspace-search',
      },
    });

    await prisma.workspaceMember.create({
      data: {
        workspaceId: workspace.id,
        userId: user.id,
        role: 'owner',
      },
    });

    workspaceUuid = workspace.uuid;
    const tokens = JWTService.generateTokenPair({
      userId: user.uuid,
      email: user.email,
    });
    accessToken = tokens.access_token;
  });

  afterAll(async () => {
    await prisma.page.deleteMany({
      where: {
        workspace: {
          uuid: workspaceUuid,
        },
      },
    });
    await prisma.workspaceMember.deleteMany({
      where: {
        workspace: {
          uuid: workspaceUuid,
        },
      },
    });
    await prisma.workspace.deleteMany({
      where: {
        uuid: workspaceUuid,
      },
    });
    await prisma.user.deleteMany({
      where: {
        email: 'test-contract-search@example.com',
      },
    });
    await prisma.$disconnect();
    await app.close();
  });

  describe('Request Contract', () => {
    it('should accept valid query parameters according to OpenAPI spec', async () => {
      const response = await request(app.getHttpServer())
        .get(`/api/v1/workspaces/${workspaceUuid}/search`)
        .query({ q: 'test query' })
        .set('Authorization', `Bearer ${accessToken}`)
        .expect(200);

      expect(response.body).toHaveProperty('success');
    });

    it('should require q query parameter', async () => {
      const response = await request(app.getHttpServer())
        .get(`/api/v1/workspaces/${workspaceUuid}/search`)
        .set('Authorization', `Bearer ${accessToken}`)
        .expect(400);

      expect(response.body.success).toBe(false);
    });

    it('should accept optional type parameter with valid enum values', async () => {
      const response = await request(app.getHttpServer())
        .get(`/api/v1/workspaces/${workspaceUuid}/search`)
        .query({ q: 'test', type: 'page' })
        .set('Authorization', `Bearer ${accessToken}`)
        .expect(200);

      expect(response.body).toHaveProperty('success', true);
    });

    it('should validate type enum values', async () => {
      const response = await request(app.getHttpServer())
        .get(`/api/v1/workspaces/${workspaceUuid}/search`)
        .query({ q: 'test', type: 'invalid_type' })
        .set('Authorization', `Bearer ${accessToken}`)
        .expect(400);

      expect(response.body.success).toBe(false);
    });
  });

  describe('Response Contract - 200 OK', () => {
    it('should return 200 status code on successful search', async () => {
      const response = await request(app.getHttpServer())
        .get(`/api/v1/workspaces/${workspaceUuid}/search`)
        .query({ q: 'test' })
        .set('Authorization', `Bearer ${accessToken}`)
        .expect(200);

      expect(response.status).toBe(200);
    });

    it('should return SearchResult schema according to OpenAPI spec', async () => {
      const response = await request(app.getHttpServer())
        .get(`/api/v1/workspaces/${workspaceUuid}/search`)
        .query({ q: 'test' })
        .set('Authorization', `Bearer ${accessToken}`)
        .expect(200);

      // Verify SearchResult structure
      expect(response.body).toHaveProperty('success', true);
      expect(response.body).toHaveProperty('data');
      expect(Array.isArray(response.body.data)).toBe(true);

      if (response.body.data.length > 0) {
        const result = response.body.data[0];
        expect(result).toHaveProperty('uuid');
        expect(result).toHaveProperty('title');
        expect(result).toHaveProperty('type');
        expect(typeof result.uuid).toBe('string');
        expect(typeof result.title).toBe('string');
        expect(typeof result.type).toBe('string');
      }
    });

    it('should return empty array when no results found', async () => {
      const response = await request(app.getHttpServer())
        .get(`/api/v1/workspaces/${workspaceUuid}/search`)
        .query({ q: 'nonexistentterm12345' })
        .set('Authorization', `Bearer ${accessToken}`)
        .expect(200);

      expect(response.body.data).toBeInstanceOf(Array);
      expect(response.body.data.length).toBe(0);
    });
  });

  describe('Response Contract - 401 Unauthorized', () => {
    it('should return 401 when authentication is missing', async () => {
      const response = await request(app.getHttpServer())
        .get(`/api/v1/workspaces/${workspaceUuid}/search`)
        .query({ q: 'test' })
        .expect(401);

      expect(response.status).toBe(401);
      expect(response.body.success).toBe(false);
    });

    it('should return error object with code and message', async () => {
      const response = await request(app.getHttpServer())
        .get(`/api/v1/workspaces/${workspaceUuid}/search`)
        .query({ q: 'test' })
        .expect(401);

      expect(response.body.error).toHaveProperty('code');
      expect(response.body.error).toHaveProperty('message');
    });
  });

  describe('Response Contract - 404 Not Found', () => {
    it('should return 404 when workspace not found', async () => {
      const fakeUuid = '00000000-0000-0000-0000-000000000000';
      const response = await request(app.getHttpServer())
        .get(`/api/v1/workspaces/${fakeUuid}/search`)
        .query({ q: 'test' })
        .set('Authorization', `Bearer ${accessToken}`)
        .expect(404);

      expect(response.status).toBe(404);
      expect(response.body.success).toBe(false);
    });
  });

  describe('Content-Type Contract', () => {
    it('should return application/json content type', async () => {
      const response = await request(app.getHttpServer())
        .get(`/api/v1/workspaces/${workspaceUuid}/search`)
        .query({ q: 'test' })
        .set('Authorization', `Bearer ${accessToken}`)
        .expect(200);

      expect(response.headers['content-type']).toMatch(/application\/json/);
    });
  });
});

