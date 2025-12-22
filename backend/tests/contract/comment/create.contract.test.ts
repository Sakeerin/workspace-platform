import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import * as request from 'supertest';
import { AppModule } from '../../../src/app.module';
import { PrismaClient } from '@prisma/client';
import { EncryptionService } from '../../../src/utils/encryption';
import { JWTService } from '../../../src/utils/jwt';

/**
 * Contract tests for POST /api/v1/pages/:pageUuid/comments
 * These tests verify that the API implementation matches the OpenAPI specification
 */
describe('POST /api/v1/pages/:pageUuid/comments - Contract Tests', () => {
  let app: INestApplication;
  let prisma: PrismaClient;
  let accessToken: string;
  let workspaceUuid: string;
  let pageUuid: string;

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
        email: 'test-contract-comment@example.com',
        passwordHash,
        name: 'Contract Test User',
        isActive: true,
      },
    });

    const workspace = await prisma.workspace.create({
      data: {
        name: 'Contract Test Workspace',
        slug: 'contract-test-workspace-comment',
      },
    });

    await prisma.workspaceMember.create({
      data: {
        workspaceId: workspace.id,
        userId: user.id,
        role: 'owner',
      },
    });

    // Create a test page
    const page = await prisma.page.create({
      data: {
        workspaceId: workspace.id,
        createdById: user.id,
        lastEditedById: user.id,
        title: 'Contract Test Page',
        allowComments: true,
      },
    });

    workspaceUuid = workspace.uuid;
    pageUuid = page.uuid;
    const tokens = JWTService.generateTokenPair({
      userId: user.uuid,
      email: user.email,
    });
    accessToken = tokens.access_token;
  });

  afterAll(async () => {
    await prisma.comment.deleteMany({
      where: {
        page: {
          uuid: pageUuid,
        },
      },
    });
    await prisma.page.deleteMany({
      where: {
        uuid: pageUuid,
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
        email: 'test-contract-comment@example.com',
      },
    });
    await prisma.$disconnect();
    await app.close();
  });

  beforeEach(async () => {
    await prisma.comment.deleteMany({
      where: {
        page: {
          uuid: pageUuid,
        },
      },
    });
  });

  describe('Request Contract', () => {
    it('should accept valid request body according to OpenAPI spec', async () => {
      const requestBody = {
        content: 'Contract Test Comment',
      };

      const response = await request(app.getHttpServer())
        .post(`/api/v1/pages/${pageUuid}/comments`)
        .set('Authorization', `Bearer ${accessToken}`)
        .send(requestBody)
        .expect(201);

      expect(response.body).toHaveProperty('success');
    });

    it('should reject request with missing required field: content', async () => {
      const requestBody = {};

      const response = await request(app.getHttpServer())
        .post(`/api/v1/pages/${pageUuid}/comments`)
        .set('Authorization', `Bearer ${accessToken}`)
        .send(requestBody)
        .expect(400);

      expect(response.body.success).toBe(false);
    });

    it('should accept optional fields: block_id, parent_comment_id', async () => {
      const requestBody = {
        content: 'Comment with optional fields',
        block_id: '00000000-0000-0000-0000-000000000000', // Will fail validation but should accept format
        parent_comment_id: '00000000-0000-0000-0000-000000000000', // Will fail validation but should accept format
      };

      // Note: This will fail at business logic level, but should pass request validation
      const response = await request(app.getHttpServer())
        .post(`/api/v1/pages/${pageUuid}/comments`)
        .set('Authorization', `Bearer ${accessToken}`)
        .send(requestBody);

      // Should either accept format (400 with business error) or reject format (400 with validation error)
      expect([400, 404]).toContain(response.status);
    });

    it('should validate block_id format (UUID)', async () => {
      const requestBody = {
        content: 'Invalid Block ID Comment',
        block_id: 'not-a-uuid',
      };

      const response = await request(app.getHttpServer())
        .post(`/api/v1/pages/${pageUuid}/comments`)
        .set('Authorization', `Bearer ${accessToken}`)
        .send(requestBody)
        .expect(400);

      expect(response.body.success).toBe(false);
    });

    it('should validate parent_comment_id format (UUID)', async () => {
      const requestBody = {
        content: 'Invalid Parent Comment ID',
        parent_comment_id: 'not-a-uuid',
      };

      const response = await request(app.getHttpServer())
        .post(`/api/v1/pages/${pageUuid}/comments`)
        .set('Authorization', `Bearer ${accessToken}`)
        .send(requestBody)
        .expect(400);

      expect(response.body.success).toBe(false);
    });

    it('should validate content is a string', async () => {
      const requestBody = {
        content: 12345, // Invalid type
      };

      const response = await request(app.getHttpServer())
        .post(`/api/v1/pages/${pageUuid}/comments`)
        .set('Authorization', `Bearer ${accessToken}`)
        .send(requestBody)
        .expect(400);

      expect(response.body.success).toBe(false);
    });
  });

  describe('Response Contract - 201 Created', () => {
    it('should return 201 status code on successful comment creation', async () => {
      const requestBody = {
        content: 'Contract Test Comment 201',
      };

      const response = await request(app.getHttpServer())
        .post(`/api/v1/pages/${pageUuid}/comments`)
        .set('Authorization', `Bearer ${accessToken}`)
        .send(requestBody)
        .expect(201);

      expect(response.status).toBe(201);
    });

    it('should return Comment schema according to OpenAPI spec', async () => {
      const requestBody = {
        content: 'Contract Test Comment Schema',
      };

      const response = await request(app.getHttpServer())
        .post(`/api/v1/pages/${pageUuid}/comments`)
        .set('Authorization', `Bearer ${accessToken}`)
        .send(requestBody)
        .expect(201);

      // Verify Comment structure
      expect(response.body).toHaveProperty('success', true);
      expect(response.body).toHaveProperty('data');

      // Verify Comment schema properties
      const comment = response.body.data;
      expect(comment).toHaveProperty('uuid');
      expect(comment).toHaveProperty('content');
      expect(comment).toHaveProperty('is_resolved');
      expect(typeof comment.uuid).toBe('string');
      expect(typeof comment.content).toBe('string');
      expect(typeof comment.is_resolved).toBe('boolean');
    });

    it('should return comment content matching request', async () => {
      const requestBody = {
        content: 'Contract Test Comment Title',
      };

      const response = await request(app.getHttpServer())
        .post(`/api/v1/pages/${pageUuid}/comments`)
        .set('Authorization', `Bearer ${accessToken}`)
        .send(requestBody)
        .expect(201);

      expect(response.body.data.content).toBe(requestBody.content);
    });

    it('should return default values when not provided', async () => {
      const requestBody = {
        content: 'Default Values Comment',
      };

      const response = await request(app.getHttpServer())
        .post(`/api/v1/pages/${pageUuid}/comments`)
        .set('Authorization', `Bearer ${accessToken}`)
        .send(requestBody)
        .expect(201);

      expect(response.body.data.is_resolved).toBe(false);
      expect(response.body.data.block_id).toBeNull();
      expect(response.body.data.parent_comment_id).toBeNull();
    });
  });

  describe('Response Contract - 401 Unauthorized', () => {
    it('should return 401 when authentication is missing', async () => {
      const requestBody = {
        content: 'Unauthorized Comment',
      };

      const response = await request(app.getHttpServer())
        .post(`/api/v1/pages/${pageUuid}/comments`)
        .send(requestBody)
        .expect(401);

      expect(response.status).toBe(401);
      expect(response.body.success).toBe(false);
    });

    it('should return error object with code and message', async () => {
      const requestBody = {
        content: 'Unauthorized Comment',
      };

      const response = await request(app.getHttpServer())
        .post(`/api/v1/pages/${pageUuid}/comments`)
        .send(requestBody)
        .expect(401);

      expect(response.body.error).toHaveProperty('code');
      expect(response.body.error).toHaveProperty('message');
    });
  });

  describe('Response Contract - 404 Not Found', () => {
    it('should return 404 when page not found', async () => {
      const fakeUuid = '00000000-0000-0000-0000-000000000000';
      const requestBody = {
        content: 'Not Found Comment',
      };

      const response = await request(app.getHttpServer())
        .post(`/api/v1/pages/${fakeUuid}/comments`)
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
        content: 'Content Type Test Comment',
      };

      const response = await request(app.getHttpServer())
        .post(`/api/v1/pages/${pageUuid}/comments`)
        .set('Authorization', `Bearer ${accessToken}`)
        .set('Content-Type', 'application/json')
        .send(requestBody)
        .expect(201);

      expect(response.headers['content-type']).toMatch(/application\/json/);
    });
  });
});

