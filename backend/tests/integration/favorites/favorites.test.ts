import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import * as request from 'supertest';
import { AppModule } from '../../../src/app.module';
import { PrismaClient } from '@prisma/client';
import { EncryptionService } from '../../../src/utils/encryption';
import { JWTService } from '../../../src/utils/jwt';

describe('Favorites Functionality (Integration)', () => {
  let app: INestApplication;
  let prisma: PrismaClient;
  let accessToken: string;
  let userId: string;
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
        email: 'test-favorites@example.com',
        passwordHash,
        name: 'Test Favorites User',
        isActive: true,
      },
    });

    const workspace = await prisma.workspace.create({
      data: {
        name: 'Test Workspace',
        slug: 'test-workspace-favorites',
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
        title: 'Favorite Test Page',
        allowComments: true,
      },
    });

    userId = user.uuid;
    workspaceUuid = workspace.uuid;
    pageUuid = page.uuid;
    const tokens = JWTService.generateTokenPair({
      userId: user.uuid,
      email: user.email,
    });
    accessToken = tokens.access_token;
  });

  afterAll(async () => {
    await prisma.favorite.deleteMany({
      where: {
        user: {
          uuid: userId,
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
        email: 'test-favorites@example.com',
      },
    });
    await prisma.$disconnect();
    await app.close();
  });

  beforeEach(async () => {
    // Clean up favorites before each test
    await prisma.favorite.deleteMany({
      where: {
        user: {
          uuid: userId,
        },
      },
    });
  });

  describe('POST /api/v1/pages/:pageUuid/favorite', () => {
    it('should add a page to favorites', async () => {
      const response = await request(app.getHttpServer())
        .post(`/api/v1/pages/${pageUuid}/favorite`)
        .set('Authorization', `Bearer ${accessToken}`)
        .expect(201);

      expect(response.body).toHaveProperty('success', true);
      expect(response.body.data).toHaveProperty('page_id', pageUuid);

      // Verify favorite exists in database
      const user = await prisma.user.findUnique({ where: { uuid: userId } });
      const favorite = await prisma.favorite.findFirst({
        where: {
          userId: user!.id,
          pageId: (await prisma.page.findUnique({ where: { uuid: pageUuid } }))!.id,
        },
      });
      expect(favorite).toBeDefined();
    });

    it('should fail when trying to favorite the same page twice', async () => {
      // First favorite
      await request(app.getHttpServer())
        .post(`/api/v1/pages/${pageUuid}/favorite`)
        .set('Authorization', `Bearer ${accessToken}`)
        .expect(201);

      // Try to favorite again
      const response = await request(app.getHttpServer())
        .post(`/api/v1/pages/${pageUuid}/favorite`)
        .set('Authorization', `Bearer ${accessToken}`)
        .expect(409);

      expect(response.body.success).toBe(false);
    });

    it('should fail without authentication', async () => {
      const response = await request(app.getHttpServer())
        .post(`/api/v1/pages/${pageUuid}/favorite`)
        .expect(401);

      expect(response.body.success).toBe(false);
    });

    it('should fail when page not found', async () => {
      const fakeUuid = '00000000-0000-0000-0000-000000000000';
      const response = await request(app.getHttpServer())
        .post(`/api/v1/pages/${fakeUuid}/favorite`)
        .set('Authorization', `Bearer ${accessToken}`)
        .expect(404);

      expect(response.body.success).toBe(false);
    });
  });

  describe('DELETE /api/v1/pages/:pageUuid/favorite', () => {
    it('should remove a page from favorites', async () => {
      // First add to favorites
      await request(app.getHttpServer())
        .post(`/api/v1/pages/${pageUuid}/favorite`)
        .set('Authorization', `Bearer ${accessToken}`)
        .expect(201);

      // Remove from favorites
      const response = await request(app.getHttpServer())
        .delete(`/api/v1/pages/${pageUuid}/favorite`)
        .set('Authorization', `Bearer ${accessToken}`)
        .expect(204);

      expect(response.status).toBe(204);

      // Verify favorite removed from database
      const user = await prisma.user.findUnique({ where: { uuid: userId } });
      const favorite = await prisma.favorite.findFirst({
        where: {
          userId: user!.id,
          pageId: (await prisma.page.findUnique({ where: { uuid: pageUuid } }))!.id,
        },
      });
      expect(favorite).toBeNull();
    });

    it('should fail when trying to remove non-existent favorite', async () => {
      const response = await request(app.getHttpServer())
        .delete(`/api/v1/pages/${pageUuid}/favorite`)
        .set('Authorization', `Bearer ${accessToken}`)
        .expect(404);

      expect(response.body.success).toBe(false);
    });

    it('should fail without authentication', async () => {
      const response = await request(app.getHttpServer())
        .delete(`/api/v1/pages/${pageUuid}/favorite`)
        .expect(401);

      expect(response.body.success).toBe(false);
    });
  });

  describe('GET /api/v1/pages/favorites', () => {
    it('should get all favorite pages for user', async () => {
      // Add multiple pages to favorites
      const page2 = await prisma.page.create({
        data: {
          workspaceId: (await prisma.workspace.findUnique({ where: { uuid: workspaceUuid } }))!.id,
          createdById: (await prisma.user.findUnique({ where: { uuid: userId } }))!.id,
          lastEditedById: (await prisma.user.findUnique({ where: { uuid: userId } }))!.id,
          title: 'Another Favorite Page',
          allowComments: true,
        },
      });

      await request(app.getHttpServer())
        .post(`/api/v1/pages/${pageUuid}/favorite`)
        .set('Authorization', `Bearer ${accessToken}`)
        .expect(201);

      await request(app.getHttpServer())
        .post(`/api/v1/pages/${page2.uuid}/favorite`)
        .set('Authorization', `Bearer ${accessToken}`)
        .expect(201);

      // Get favorites
      const response = await request(app.getHttpServer())
        .get('/api/v1/pages/favorites')
        .set('Authorization', `Bearer ${accessToken}`)
        .expect(200);

      expect(response.body).toHaveProperty('success', true);
      expect(response.body.data).toBeInstanceOf(Array);
      expect(response.body.data.length).toBeGreaterThanOrEqual(2);
      expect(response.body.data.some((p: any) => p.uuid === pageUuid)).toBe(true);
      expect(response.body.data.some((p: any) => p.uuid === page2.uuid)).toBe(true);

      // Clean up
      await prisma.page.delete({ where: { id: page2.id } });
    });

    it('should return empty array when user has no favorites', async () => {
      const response = await request(app.getHttpServer())
        .get('/api/v1/pages/favorites')
        .set('Authorization', `Bearer ${accessToken}`)
        .expect(200);

      expect(response.body).toHaveProperty('success', true);
      expect(response.body.data).toBeInstanceOf(Array);
      expect(response.body.data.length).toBe(0);
    });

    it('should fail without authentication', async () => {
      const response = await request(app.getHttpServer())
        .get('/api/v1/pages/favorites')
        .expect(401);

      expect(response.body.success).toBe(false);
    });
  });
});

