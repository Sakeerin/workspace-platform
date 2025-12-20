import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import * as request from 'supertest';
import { AppModule } from '../../../src/app.module';
import { PrismaClient } from '@prisma/client';
import { EncryptionService } from '../../../src/utils/encryption';
import { JWTService } from '../../../src/utils/jwt';

/**
 * Contract tests for POST /api/v1/workspaces/:uuid/pages
 * These tests verify that the API implementation matches the OpenAPI specification
 */
describe('POST /api/v1/workspaces/:uuid/pages - Contract Tests', () => {
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
        email: 'test-contract-page@example.com',
        passwordHash,
        name: 'Contract Test User',
        isActive: true,
      },
    });

    const workspace = await prisma.workspace.create({
      data: {
        name: 'Contract Test Workspace',
        slug: 'contract-test-workspace',
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
        email: 'test-contract-page@example.com',
      },
    });
    await prisma.$disconnect();
    await app.close();
  });

  beforeEach(async () => {
    await prisma.page.deleteMany({
      where: {
        workspace: {
          uuid: workspaceUuid,
        },
      },
    });
  });

  describe('Request Contract', () => {
    it('should accept valid request body according to OpenAPI spec', async () => {
      const requestBody = {
        title: 'Contract Test Page',
      };

      const response = await request(app.getHttpServer())
        .post(`/api/v1/workspaces/${workspaceUuid}/pages`)
        .set('Authorization', `Bearer ${accessToken}`)
        .send(requestBody)
        .expect(201);

      expect(response.body).toHaveProperty('success');
    });

    it('should reject request with missing required field: title', async () => {
      const requestBody = {};

      const response = await request(app.getHttpServer())
        .post(`/api/v1/workspaces/${workspaceUuid}/pages`)
        .set('Authorization', `Bearer ${accessToken}`)
        .send(requestBody)
        .expect(400);

      expect(response.body.success).toBe(false);
    });

    it('should accept optional fields: parent_id, type, icon, visibility', async () => {
      const requestBody = {
        title: 'Optional Fields Page',
        icon: '📄',
        type: 'page',
        visibility: 'private',
      };

      const response = await request(app.getHttpServer())
        .post(`/api/v1/workspaces/${workspaceUuid}/pages`)
        .set('Authorization', `Bearer ${accessToken}`)
        .send(requestBody)
        .expect(201);

      expect(response.body.data.icon).toBe(requestBody.icon);
      expect(response.body.data.type).toBe(requestBody.type);
      expect(response.body.data.visibility).toBe(requestBody.visibility);
    });

    it('should validate type enum values', async () => {
      const requestBody = {
        title: 'Invalid Type Page',
        type: 'invalid_type',
      };

      const response = await request(app.getHttpServer())
        .post(`/api/v1/workspaces/${workspaceUuid}/pages`)
        .set('Authorization', `Bearer ${accessToken}`)
        .send(requestBody)
        .expect(400);

      expect(response.body.success).toBe(false);
    });

    it('should validate visibility enum values', async () => {
      const requestBody = {
        title: 'Invalid Visibility Page',
        visibility: 'invalid_visibility',
      };

      const response = await request(app.getHttpServer())
        .post(`/api/v1/workspaces/${workspaceUuid}/pages`)
        .set('Authorization', `Bearer ${accessToken}`)
        .send(requestBody)
        .expect(400);

      expect(response.body.success).toBe(false);
    });

    it('should validate parent_id format (UUID)', async () => {
      const requestBody = {
        title: 'Invalid Parent Page',
        parent_id: 'not-a-uuid',
      };

      const response = await request(app.getHttpServer())
        .post(`/api/v1/workspaces/${workspaceUuid}/pages`)
        .set('Authorization', `Bearer ${accessToken}`)
        .send(requestBody)
        .expect(400);

      expect(response.body.success).toBe(false);
    });
  });

  describe('Response Contract - 201 Created', () => {
    it('should return 201 status code on successful page creation', async () => {
      const requestBody = {
        title: 'Contract Test Page 201',
      };

      const response = await request(app.getHttpServer())
        .post(`/api/v1/workspaces/${workspaceUuid}/pages`)
        .set('Authorization', `Bearer ${accessToken}`)
        .send(requestBody)
        .expect(201);

      expect(response.status).toBe(201);
    });

    it('should return Page schema according to OpenAPI spec', async () => {
      const requestBody = {
        title: 'Contract Test Page Schema',
      };

      const response = await request(app.getHttpServer())
        .post(`/api/v1/workspaces/${workspaceUuid}/pages`)
        .set('Authorization', `Bearer ${accessToken}`)
        .send(requestBody)
        .expect(201);

      // Verify Page structure
      expect(response.body).toHaveProperty('success', true);
      expect(response.body).toHaveProperty('data');

      // Verify Page schema properties
      const page = response.body.data;
      expect(page).toHaveProperty('uuid');
      expect(page).toHaveProperty('title');
      expect(page).toHaveProperty('type');
      expect(page).toHaveProperty('visibility');
      expect(typeof page.uuid).toBe('string');
      expect(typeof page.title).toBe('string');
      expect(typeof page.type).toBe('string');
      expect(typeof page.visibility).toBe('string');
    });

    it('should return page title matching request', async () => {
      const requestBody = {
        title: 'Contract Test Page Title',
      };

      const response = await request(app.getHttpServer())
        .post(`/api/v1/workspaces/${workspaceUuid}/pages`)
        .set('Authorization', `Bearer ${accessToken}`)
        .send(requestBody)
        .expect(201);

      expect(response.body.data.title).toBe(requestBody.title);
    });

    it('should return default values when not provided', async () => {
      const requestBody = {
        title: 'Default Values Page',
      };

      const response = await request(app.getHttpServer())
        .post(`/api/v1/workspaces/${workspaceUuid}/pages`)
        .set('Authorization', `Bearer ${accessToken}`)
        .send(requestBody)
        .expect(201);

      expect(response.body.data.type).toBe('page');
      expect(response.body.data.visibility).toBe('workspace');
    });
  });

  describe('Response Contract - 401 Unauthorized', () => {
    it('should return 401 when authentication is missing', async () => {
      const requestBody = {
        title: 'Unauthorized Page',
      };

      const response = await request(app.getHttpServer())
        .post(`/api/v1/workspaces/${workspaceUuid}/pages`)
        .send(requestBody)
        .expect(401);

      expect(response.status).toBe(401);
      expect(response.body.success).toBe(false);
    });

    it('should return error object with code and message', async () => {
      const requestBody = {
        title: 'Unauthorized Page',
      };

      const response = await request(app.getHttpServer())
        .post(`/api/v1/workspaces/${workspaceUuid}/pages`)
        .send(requestBody)
        .expect(401);

      expect(response.body.error).toHaveProperty('code');
      expect(response.body.error).toHaveProperty('message');
    });
  });

  describe('Response Contract - 404 Not Found', () => {
    it('should return 404 when workspace not found', async () => {
      const fakeUuid = '00000000-0000-0000-0000-000000000000';
      const requestBody = {
        title: 'Not Found Page',
      };

      const response = await request(app.getHttpServer())
        .post(`/api/v1/workspaces/${fakeUuid}/pages`)
        .set('Authorization', `Bearer ${accessToken}`)
        .send(requestBody)
        .expect(404);

      expect(response.status).toBe(404);
      expect(response.body.success).toBe(false);
    });
  });

  describe('Content-Type Contract', () => {
    it('should accept application/json content type', async () => {
      const requestBody = {
        title: 'Content Type Test Page',
      };

      const response = await request(app.getHttpServer())
        .post(`/api/v1/workspaces/${workspaceUuid}/pages`)
        .set('Authorization', `Bearer ${accessToken}`)
        .set('Content-Type', 'application/json')
        .send(requestBody)
        .expect(201);

      expect(response.headers['content-type']).toMatch(/application\/json/);
    });
  });
});

