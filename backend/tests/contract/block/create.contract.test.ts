import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import * as request from 'supertest';
import { AppModule } from '../../../src/app.module';
import { PrismaClient } from '@prisma/client';
import { EncryptionService } from '../../../src/utils/encryption';
import { JWTService } from '../../../src/utils/jwt';

/**
 * Contract tests for POST /api/v1/pages/:uuid/blocks
 * These tests verify that the API implementation matches the OpenAPI specification
 */
describe('POST /api/v1/pages/:uuid/blocks - Contract Tests', () => {
  let app: INestApplication;
  let prisma: PrismaClient;
  let accessToken: string;
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

    // Create test user, workspace, and page
    const passwordHash = await EncryptionService.hashPassword('password123');
    const user = await prisma.user.create({
      data: {
        email: 'test-contract-block@example.com',
        passwordHash,
        name: 'Contract Test User',
        isActive: true,
      },
    });

    const workspace = await prisma.workspace.create({
      data: {
        name: 'Contract Test Workspace',
        slug: 'contract-test-workspace-block',
      },
    });

    await prisma.workspaceMember.create({
      data: {
        workspaceId: workspace.id,
        userId: user.id,
        role: 'owner',
      },
    });

    const page = await prisma.page.create({
      data: {
        workspaceId: workspace.id,
        createdById: user.id,
        lastEditedById: user.id,
        title: 'Contract Test Page',
      },
    });

    pageUuid = page.uuid;
    const tokens = JWTService.generateTokenPair({
      userId: user.uuid,
      email: user.email,
    });
    accessToken = tokens.access_token;
  });

  afterAll(async () => {
    await prisma.block.deleteMany({
      where: {
        page: {
          uuid: pageUuid,
        },
      },
    });
    await prisma.page.deleteMany({
      where: {
        uuid: pageUuid,
      },
    });
    await prisma.workspaceMember.deleteMany({
      where: {
        user: {
          email: 'test-contract-block@example.com',
        },
      },
    });
    await prisma.workspace.deleteMany({
      where: {
        members: {
          some: {
            user: {
              email: 'test-contract-block@example.com',
            },
          },
        },
      },
    });
    await prisma.user.deleteMany({
      where: {
        email: 'test-contract-block@example.com',
      },
    });
    await prisma.$disconnect();
    await app.close();
  });

  beforeEach(async () => {
    await prisma.block.deleteMany({
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
        type: 'paragraph',
        content: { text: 'Test content' },
      };

      const response = await request(app.getHttpServer())
        .post(`/api/v1/pages/${pageUuid}/blocks`)
        .set('Authorization', `Bearer ${accessToken}`)
        .send(requestBody)
        .expect(201);

      expect(response.body).toHaveProperty('success');
    });

    it('should reject request with missing required field: type', async () => {
      const requestBody = {
        content: { text: 'Missing type' },
      };

      const response = await request(app.getHttpServer())
        .post(`/api/v1/pages/${pageUuid}/blocks`)
        .set('Authorization', `Bearer ${accessToken}`)
        .send(requestBody)
        .expect(400);

      expect(response.body.success).toBe(false);
    });

    it('should reject request with missing required field: content', async () => {
      const requestBody = {
        type: 'paragraph',
      };

      const response = await request(app.getHttpServer())
        .post(`/api/v1/pages/${pageUuid}/blocks`)
        .set('Authorization', `Bearer ${accessToken}`)
        .send(requestBody)
        .expect(400);

      expect(response.body.success).toBe(false);
    });

    it('should accept optional fields: parent_block_id, position', async () => {
      const requestBody = {
        type: 'paragraph',
        content: { text: 'Optional fields block' },
        position: 1,
      };

      const response = await request(app.getHttpServer())
        .post(`/api/v1/pages/${pageUuid}/blocks`)
        .set('Authorization', `Bearer ${accessToken}`)
        .send(requestBody)
        .expect(201);

      expect(response.body.data.position).toBe(1);
    });

    it('should validate parent_block_id format (UUID)', async () => {
      const requestBody = {
        type: 'paragraph',
        content: { text: 'Invalid parent' },
        parent_block_id: 'not-a-uuid',
      };

      const response = await request(app.getHttpServer())
        .post(`/api/v1/pages/${pageUuid}/blocks`)
        .set('Authorization', `Bearer ${accessToken}`)
        .send(requestBody)
        .expect(400);

      expect(response.body.success).toBe(false);
    });
  });

  describe('Response Contract - 201 Created', () => {
    it('should return 201 status code on successful block creation', async () => {
      const requestBody = {
        type: 'paragraph',
        content: { text: 'Test block' },
      };

      const response = await request(app.getHttpServer())
        .post(`/api/v1/pages/${pageUuid}/blocks`)
        .set('Authorization', `Bearer ${accessToken}`)
        .send(requestBody)
        .expect(201);

      expect(response.status).toBe(201);
    });

    it('should return Block schema according to OpenAPI spec', async () => {
      const requestBody = {
        type: 'paragraph',
        content: { text: 'Block schema test' },
      };

      const response = await request(app.getHttpServer())
        .post(`/api/v1/pages/${pageUuid}/blocks`)
        .set('Authorization', `Bearer ${accessToken}`)
        .send(requestBody)
        .expect(201);

      // Verify Block structure
      expect(response.body).toHaveProperty('success', true);
      expect(response.body).toHaveProperty('data');

      // Verify Block schema properties
      const block = response.body.data;
      expect(block).toHaveProperty('uuid');
      expect(block).toHaveProperty('type');
      expect(block).toHaveProperty('content');
      expect(typeof block.uuid).toBe('string');
      expect(typeof block.type).toBe('string');
      expect(typeof block.content).toBe('object');
    });

    it('should return block type and content matching request', async () => {
      const requestBody = {
        type: 'heading1',
        content: { text: 'Heading' },
      };

      const response = await request(app.getHttpServer())
        .post(`/api/v1/pages/${pageUuid}/blocks`)
        .set('Authorization', `Bearer ${accessToken}`)
        .send(requestBody)
        .expect(201);

      expect(response.body.data.type).toBe(requestBody.type);
      expect(response.body.data.content.text).toBe(requestBody.content.text);
    });
  });

  describe('Response Contract - 401 Unauthorized', () => {
    it('should return 401 when authentication is missing', async () => {
      const requestBody = {
        type: 'paragraph',
        content: { text: 'Unauthorized block' },
      };

      const response = await request(app.getHttpServer())
        .post(`/api/v1/pages/${pageUuid}/blocks`)
        .send(requestBody)
        .expect(401);

      expect(response.status).toBe(401);
      expect(response.body.success).toBe(false);
    });
  });

  describe('Response Contract - 404 Not Found', () => {
    it('should return 404 when page not found', async () => {
      const fakeUuid = '00000000-0000-0000-0000-000000000000';
      const requestBody = {
        type: 'paragraph',
        content: { text: 'Not found' },
      };

      const response = await request(app.getHttpServer())
        .post(`/api/v1/pages/${fakeUuid}/blocks`)
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
        type: 'paragraph',
        content: { text: 'Content type test' },
      };

      const response = await request(app.getHttpServer())
        .post(`/api/v1/pages/${pageUuid}/blocks`)
        .set('Authorization', `Bearer ${accessToken}`)
        .set('Content-Type', 'application/json')
        .send(requestBody)
        .expect(201);

      expect(response.headers['content-type']).toMatch(/application\/json/);
    });
  });
});

