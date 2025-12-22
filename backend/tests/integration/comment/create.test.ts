import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import * as request from 'supertest';
import { AppModule } from '../../../src/app.module';
import { PrismaClient } from '@prisma/client';
import { EncryptionService } from '../../../src/utils/encryption';
import { JWTService } from '../../../src/utils/jwt';

describe('Comment Creation (Integration)', () => {
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
        email: 'test-comment@example.com',
        passwordHash,
        name: 'Test Comment User',
        isActive: true,
      },
    });

    const workspace = await prisma.workspace.create({
      data: {
        name: 'Test Workspace',
        slug: 'test-workspace-comment',
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
        title: 'Test Page for Comments',
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
        email: 'test-comment@example.com',
      },
    });
    await prisma.$disconnect();
    await app.close();
  });

  beforeEach(async () => {
    // Clean up comments before each test
    await prisma.comment.deleteMany({
      where: {
        page: {
          uuid: pageUuid,
        },
      },
    });
  });

  describe('POST /api/v1/pages/:pageUuid/comments', () => {
    it('should create a comment successfully', async () => {
      const commentData = {
        content: 'This is a test comment',
      };

      const response = await request(app.getHttpServer())
        .post(`/api/v1/pages/${pageUuid}/comments`)
        .set('Authorization', `Bearer ${accessToken}`)
        .send(commentData)
        .expect(201);

      expect(response.body).toHaveProperty('success', true);
      expect(response.body.data).toHaveProperty('uuid');
      expect(response.body.data.content).toBe(commentData.content);
      expect(response.body.data.is_resolved).toBe(false);

      // Verify comment exists in database
      const comment = await prisma.comment.findUnique({
        where: { uuid: response.body.data.uuid },
      });
      expect(comment).toBeDefined();
      expect(comment?.content).toBe(commentData.content);
    });

    it('should create a comment with block_id', async () => {
      // Create a test block
      const block = await prisma.block.create({
        data: {
          pageId: (await prisma.page.findUnique({ where: { uuid: pageUuid } }))!.id,
          createdById: (await prisma.user.findUnique({ where: { uuid: userId } }))!.id,
          lastEditedById: (await prisma.user.findUnique({ where: { uuid: userId } }))!.id,
          type: 'paragraph',
          content: {},
        },
      });

      const commentData = {
        content: 'Comment on a block',
        block_id: block.uuid,
      };

      const response = await request(app.getHttpServer())
        .post(`/api/v1/pages/${pageUuid}/comments`)
        .set('Authorization', `Bearer ${accessToken}`)
        .send(commentData)
        .expect(201);

      expect(response.body.data.block_id).toBe(block.uuid);

      // Clean up
      await prisma.block.delete({ where: { id: block.id } });
    });

    it('should create a comment with mentions', async () => {
      // Create another user to mention
      const mentionedUser = await prisma.user.create({
        data: {
          email: 'mentioned@example.com',
          passwordHash: await EncryptionService.hashPassword('password123'),
          name: 'Mentioned User',
          isActive: true,
        },
      });

      await prisma.workspaceMember.create({
        data: {
          workspaceId: (await prisma.workspace.findUnique({ where: { uuid: workspaceUuid } }))!.id,
          userId: mentionedUser.id,
          role: 'member',
        },
      });

      const commentData = {
        content: 'Comment with @mention',
        mentions: [mentionedUser.uuid],
      };

      const response = await request(app.getHttpServer())
        .post(`/api/v1/pages/${pageUuid}/comments`)
        .set('Authorization', `Bearer ${accessToken}`)
        .send(commentData)
        .expect(201);

      expect(response.body.data.mentions).toContain(mentionedUser.uuid);

      // Clean up
      await prisma.workspaceMember.delete({ where: { userId: mentionedUser.id } });
      await prisma.user.delete({ where: { id: mentionedUser.id } });
    });

    it('should fail without authentication', async () => {
      const commentData = {
        content: 'Unauthorized Comment',
      };

      const response = await request(app.getHttpServer())
        .post(`/api/v1/pages/${pageUuid}/comments`)
        .send(commentData)
        .expect(401);

      expect(response.body.success).toBe(false);
    });

    it('should fail with missing required fields', async () => {
      const response = await request(app.getHttpServer())
        .post(`/api/v1/pages/${pageUuid}/comments`)
        .set('Authorization', `Bearer ${accessToken}`)
        .send({})
        .expect(400);

      expect(response.body.success).toBe(false);
    });

    it('should fail when page not found', async () => {
      const fakeUuid = '00000000-0000-0000-0000-000000000000';
      const commentData = {
        content: 'Test Comment',
      };

      const response = await request(app.getHttpServer())
        .post(`/api/v1/pages/${fakeUuid}/comments`)
        .set('Authorization', `Bearer ${accessToken}`)
        .send(commentData)
        .expect(404);

      expect(response.body.success).toBe(false);
    });

    it('should fail when comments are not allowed on page', async () => {
      // Create a page with comments disabled
      const noCommentPage = await prisma.page.create({
        data: {
          workspaceId: (await prisma.workspace.findUnique({ where: { uuid: workspaceUuid } }))!.id,
          createdById: (await prisma.user.findUnique({ where: { uuid: userId } }))!.id,
          lastEditedById: (await prisma.user.findUnique({ where: { uuid: userId } }))!.id,
          title: 'No Comments Page',
          allowComments: false,
        },
      });

      const commentData = {
        content: 'Should fail',
      };

      const response = await request(app.getHttpServer())
        .post(`/api/v1/pages/${noCommentPage.uuid}/comments`)
        .set('Authorization', `Bearer ${accessToken}`)
        .send(commentData)
        .expect(400);

      expect(response.body.success).toBe(false);

      // Clean up
      await prisma.page.delete({ where: { id: noCommentPage.id } });
    });

    it('should set user_id to current user', async () => {
      const commentData = {
        content: 'User Comment',
      };

      const response = await request(app.getHttpServer())
        .post(`/api/v1/pages/${pageUuid}/comments`)
        .set('Authorization', `Bearer ${accessToken}`)
        .send(commentData)
        .expect(201);

      const user = await prisma.user.findUnique({
        where: { uuid: userId },
      });

      const comment = await prisma.comment.findUnique({
        where: { uuid: response.body.data.uuid },
      });

      expect(comment?.userId).toBe(user?.id);
    });
  });
});

