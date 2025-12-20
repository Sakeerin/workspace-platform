import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import * as request from 'supertest';
import { AppModule } from '../../../src/app.module';
import { PrismaClient } from '@prisma/client';
import { EncryptionService } from '../../../src/utils/encryption';
import { JWTService } from '../../../src/utils/jwt';

describe('Page Creation (Integration)', () => {
  let app: INestApplication;
  let prisma: PrismaClient;
  let accessToken: string;
  let userId: string;
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
        email: 'test-page@example.com',
        passwordHash,
        name: 'Test Page User',
        isActive: true,
      },
    });

    const workspace = await prisma.workspace.create({
      data: {
        name: 'Test Workspace',
        slug: 'test-workspace-page',
      },
    });

    await prisma.workspaceMember.create({
      data: {
        workspaceId: workspace.id,
        userId: user.id,
        role: 'owner',
      },
    });

    userId = user.uuid;
    workspaceUuid = workspace.uuid;
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
        email: 'test-page@example.com',
      },
    });
    await prisma.$disconnect();
    await app.close();
  });

  beforeEach(async () => {
    // Clean up pages before each test
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
  });

  describe('POST /api/v1/workspaces/:uuid/pages', () => {
    it('should create a page successfully', async () => {
      const pageData = {
        title: 'Test Page',
      };

      const response = await request(app.getHttpServer())
        .post(`/api/v1/workspaces/${workspaceUuid}/pages`)
        .set('Authorization', `Bearer ${accessToken}`)
        .send(pageData)
        .expect(201);

      expect(response.body).toHaveProperty('success', true);
      expect(response.body.data).toHaveProperty('uuid');
      expect(response.body.data.title).toBe(pageData.title);
      expect(response.body.data.type).toBe('page');
      expect(response.body.data.visibility).toBe('workspace');

      // Verify page exists in database
      const page = await prisma.page.findUnique({
        where: { uuid: response.body.data.uuid },
      });
      expect(page).toBeDefined();
      expect(page?.title).toBe(pageData.title);
    });

    it('should create a page with optional fields', async () => {
      const pageData = {
        title: 'Advanced Page',
        icon: '📄',
        visibility: 'private',
      };

      const response = await request(app.getHttpServer())
        .post(`/api/v1/workspaces/${workspaceUuid}/pages`)
        .set('Authorization', `Bearer ${accessToken}`)
        .send(pageData)
        .expect(201);

      expect(response.body.data.icon).toBe(pageData.icon);
      expect(response.body.data.visibility).toBe(pageData.visibility);
    });

    it('should create a child page with parent_id', async () => {
      // First create parent page
      const parentResponse = await request(app.getHttpServer())
        .post(`/api/v1/workspaces/${workspaceUuid}/pages`)
        .set('Authorization', `Bearer ${accessToken}`)
        .send({ title: 'Parent Page' })
        .expect(201);

      // Then create child page
      const childResponse = await request(app.getHttpServer())
        .post(`/api/v1/workspaces/${workspaceUuid}/pages`)
        .set('Authorization', `Bearer ${accessToken}`)
        .send({
          title: 'Child Page',
          parent_id: parentResponse.body.data.uuid,
        })
        .expect(201);

      expect(childResponse.body.data.parent_id).toBe(parentResponse.body.data.uuid);

      // Verify in database
      const childPage = await prisma.page.findUnique({
        where: { uuid: childResponse.body.data.uuid },
        include: { parent: true },
      });
      expect(childPage?.parent?.uuid).toBe(parentResponse.body.data.uuid);
    });

    it('should fail without authentication', async () => {
      const pageData = {
        title: 'Unauthorized Page',
      };

      const response = await request(app.getHttpServer())
        .post(`/api/v1/workspaces/${workspaceUuid}/pages`)
        .send(pageData)
        .expect(401);

      expect(response.body.success).toBe(false);
    });

    it('should fail with missing required fields', async () => {
      const response = await request(app.getHttpServer())
        .post(`/api/v1/workspaces/${workspaceUuid}/pages`)
        .set('Authorization', `Bearer ${accessToken}`)
        .send({})
        .expect(400);

      expect(response.body.success).toBe(false);
    });

    it('should fail when workspace not found', async () => {
      const fakeUuid = '00000000-0000-0000-0000-000000000000';
      const pageData = {
        title: 'Test Page',
      };

      const response = await request(app.getHttpServer())
        .post(`/api/v1/workspaces/${fakeUuid}/pages`)
        .set('Authorization', `Bearer ${accessToken}`)
        .send(pageData)
        .expect(404);

      expect(response.body.success).toBe(false);
    });

    it('should set default values for new page', async () => {
      const pageData = {
        title: 'Default Page',
      };

      const response = await request(app.getHttpServer())
        .post(`/api/v1/workspaces/${workspaceUuid}/pages`)
        .set('Authorization', `Bearer ${accessToken}`)
        .send(pageData)
        .expect(201);

      const page = await prisma.page.findUnique({
        where: { uuid: response.body.data.uuid },
      });

      expect(page?.type).toBe('page');
      expect(page?.visibility).toBe('workspace');
      expect(page?.isArchived).toBe(false);
      expect(page?.isFavorite).toBe(false);
      expect(page?.allowComments).toBe(true);
    });

    it('should set created_by and last_edited_by to current user', async () => {
      const pageData = {
        title: 'User Page',
      };

      const response = await request(app.getHttpServer())
        .post(`/api/v1/workspaces/${workspaceUuid}/pages`)
        .set('Authorization', `Bearer ${accessToken}`)
        .send(pageData)
        .expect(201);

      const user = await prisma.user.findUnique({
        where: { uuid: userId },
      });

      const page = await prisma.page.findUnique({
        where: { uuid: response.body.data.uuid },
      });

      expect(page?.createdById).toBe(user?.id);
      expect(page?.lastEditedById).toBe(user?.id);
    });
  });
});

