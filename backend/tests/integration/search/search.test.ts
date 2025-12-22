import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import * as request from 'supertest';
import { AppModule } from '../../../src/app.module';
import { PrismaClient } from '@prisma/client';
import { EncryptionService } from '../../../src/utils/encryption';
import { JWTService } from '../../../src/utils/jwt';

describe('Search Functionality (Integration)', () => {
  let app: INestApplication;
  let prisma: PrismaClient;
  let accessToken: string;
  let userId: string;
  let workspaceUuid: string;
  let pageUuid1: string;
  let pageUuid2: string;

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
        email: 'test-search@example.com',
        passwordHash,
        name: 'Test Search User',
        isActive: true,
      },
    });

    const workspace = await prisma.workspace.create({
      data: {
        name: 'Test Workspace',
        slug: 'test-workspace-search',
      },
    });

    await prisma.workspaceMember.create({
      data: {
        workspaceId: workspace.id,
        userId: user.id,
        role: 'owner',
      },
    });

    // Create test pages
    const page1 = await prisma.page.create({
      data: {
        workspaceId: workspace.id,
        createdById: user.id,
        lastEditedById: user.id,
        title: 'Search Test Page One',
        contentText: 'This is a test page for searching functionality',
        allowComments: true,
      },
    });

    const page2 = await prisma.page.create({
      data: {
        workspaceId: workspace.id,
        createdById: user.id,
        lastEditedById: user.id,
        title: 'Another Search Page',
        contentText: 'This page contains different content for testing',
        allowComments: true,
      },
    });

    userId = user.uuid;
    workspaceUuid = workspace.uuid;
    pageUuid1 = page1.uuid;
    pageUuid2 = page2.uuid;
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
          workspace: {
            uuid: workspaceUuid,
          },
        },
      },
    });
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
        email: 'test-search@example.com',
      },
    });
    await prisma.$disconnect();
    await app.close();
  });

  describe('GET /api/v1/workspaces/:workspaceUuid/search', () => {
    it('should search pages by title', async () => {
      const response = await request(app.getHttpServer())
        .get(`/api/v1/workspaces/${workspaceUuid}/search`)
        .query({ q: 'Search Test' })
        .set('Authorization', `Bearer ${accessToken}`)
        .expect(200);

      expect(response.body).toHaveProperty('success', true);
      expect(response.body.data).toBeInstanceOf(Array);
      expect(response.body.data.length).toBeGreaterThan(0);
      expect(response.body.data.some((item: any) => item.title.includes('Search Test'))).toBe(true);
    });

    it('should search pages by content', async () => {
      const response = await request(app.getHttpServer())
        .get(`/api/v1/workspaces/${workspaceUuid}/search`)
        .query({ q: 'searching functionality' })
        .set('Authorization', `Bearer ${accessToken}`)
        .expect(200);

      expect(response.body).toHaveProperty('success', true);
      expect(response.body.data).toBeInstanceOf(Array);
    });

    it('should filter search results by type', async () => {
      const response = await request(app.getHttpServer())
        .get(`/api/v1/workspaces/${workspaceUuid}/search`)
        .query({ q: 'Page', type: 'page' })
        .set('Authorization', `Bearer ${accessToken}`)
        .expect(200);

      expect(response.body).toHaveProperty('success', true);
      expect(response.body.data).toBeInstanceOf(Array);
      // All results should be of type 'page'
      response.body.data.forEach((item: any) => {
        expect(item.type).toBe('page');
      });
    });

    it('should return empty array when no results found', async () => {
      const response = await request(app.getHttpServer())
        .get(`/api/v1/workspaces/${workspaceUuid}/search`)
        .query({ q: 'nonexistentterm12345' })
        .set('Authorization', `Bearer ${accessToken}`)
        .expect(200);

      expect(response.body).toHaveProperty('success', true);
      expect(response.body.data).toBeInstanceOf(Array);
      expect(response.body.data.length).toBe(0);
    });

    it('should fail without authentication', async () => {
      const response = await request(app.getHttpServer())
        .get(`/api/v1/workspaces/${workspaceUuid}/search`)
        .query({ q: 'test' })
        .expect(401);

      expect(response.body.success).toBe(false);
    });

    it('should fail with missing query parameter', async () => {
      const response = await request(app.getHttpServer())
        .get(`/api/v1/workspaces/${workspaceUuid}/search`)
        .set('Authorization', `Bearer ${accessToken}`)
        .expect(400);

      expect(response.body.success).toBe(false);
    });

    it('should fail when workspace not found', async () => {
      const fakeUuid = '00000000-0000-0000-0000-000000000000';
      const response = await request(app.getHttpServer())
        .get(`/api/v1/workspaces/${fakeUuid}/search`)
        .query({ q: 'test' })
        .set('Authorization', `Bearer ${accessToken}`)
        .expect(404);

      expect(response.body.success).toBe(false);
    });

    it('should return search results with correct structure', async () => {
      const response = await request(app.getHttpServer())
        .get(`/api/v1/workspaces/${workspaceUuid}/search`)
        .query({ q: 'Page' })
        .set('Authorization', `Bearer ${accessToken}`)
        .expect(200);

      expect(response.body).toHaveProperty('success', true);
      expect(response.body).toHaveProperty('data');

      if (response.body.data.length > 0) {
        const result = response.body.data[0];
        expect(result).toHaveProperty('uuid');
        expect(result).toHaveProperty('title');
        expect(result).toHaveProperty('type');
        expect(typeof result.uuid).toBe('string');
        expect(typeof result.title).toBe('string');
      }
    });
  });
});

