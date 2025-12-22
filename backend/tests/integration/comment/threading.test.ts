import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import * as request from 'supertest';
import { AppModule } from '../../../src/app.module';
import { PrismaClient } from '@prisma/client';
import { EncryptionService } from '../../../src/utils/encryption';
import { JWTService } from '../../../src/utils/jwt';

describe('Comment Threading (Integration)', () => {
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
        email: 'test-threading@example.com',
        passwordHash,
        name: 'Test Threading User',
        isActive: true,
      },
    });

    const workspace = await prisma.workspace.create({
      data: {
        name: 'Test Workspace',
        slug: 'test-workspace-threading',
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
        title: 'Test Page for Threading',
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
        email: 'test-threading@example.com',
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

  describe('Comment Threading', () => {
    it('should create a parent comment and reply to it', async () => {
      // Create parent comment
      const parentResponse = await request(app.getHttpServer())
        .post(`/api/v1/pages/${pageUuid}/comments`)
        .set('Authorization', `Bearer ${accessToken}`)
        .send({
          content: 'Parent comment',
        })
        .expect(201);

      const parentUuid = parentResponse.body.data.uuid;

      // Create reply
      const replyResponse = await request(app.getHttpServer())
        .post(`/api/v1/pages/${pageUuid}/comments`)
        .set('Authorization', `Bearer ${accessToken}`)
        .send({
          content: 'Reply to parent',
          parent_comment_id: parentUuid,
        })
        .expect(201);

      expect(replyResponse.body.data.parent_comment_id).toBe(parentUuid);

      // Verify in database
      const parentComment = await prisma.comment.findUnique({
        where: { uuid: parentUuid },
        include: { childComments: true },
      });
      expect(parentComment?.childComments.length).toBeGreaterThanOrEqual(1);
    });

    it('should create multiple replies to the same parent', async () => {
      // Create parent
      const parentResponse = await request(app.getHttpServer())
        .post(`/api/v1/pages/${pageUuid}/comments`)
        .set('Authorization', `Bearer ${accessToken}`)
        .send({ content: 'Parent with multiple replies' })
        .expect(201);

      const parentUuid = parentResponse.body.data.uuid;

      // Create multiple replies
      await request(app.getHttpServer())
        .post(`/api/v1/pages/${pageUuid}/comments`)
        .set('Authorization', `Bearer ${accessToken}`)
        .send({
          content: 'Reply 1',
          parent_comment_id: parentUuid,
        })
        .expect(201);

      await request(app.getHttpServer())
        .post(`/api/v1/pages/${pageUuid}/comments`)
        .set('Authorization', `Bearer ${accessToken}`)
        .send({
          content: 'Reply 2',
          parent_comment_id: parentUuid,
        })
        .expect(201);

      await request(app.getHttpServer())
        .post(`/api/v1/pages/${pageUuid}/comments`)
        .set('Authorization', `Bearer ${accessToken}`)
        .send({
          content: 'Reply 3',
          parent_comment_id: parentUuid,
        })
        .expect(201);

      // Verify all replies exist
      const parentComment = await prisma.comment.findUnique({
        where: { uuid: parentUuid },
        include: { childComments: true },
      });
      expect(parentComment?.childComments.length).toBeGreaterThanOrEqual(3);
    });

    it('should create nested replies (reply to a reply)', async () => {
      // Create parent
      const parentResponse = await request(app.getHttpServer())
        .post(`/api/v1/pages/${pageUuid}/comments`)
        .set('Authorization', `Bearer ${accessToken}`)
        .send({ content: 'Parent comment' })
        .expect(201);

      const parentUuid = parentResponse.body.data.uuid;

      // Create first reply
      const firstReplyResponse = await request(app.getHttpServer())
        .post(`/api/v1/pages/${pageUuid}/comments`)
        .set('Authorization', `Bearer ${accessToken}`)
        .send({
          content: 'First reply',
          parent_comment_id: parentUuid,
        })
        .expect(201);

      const firstReplyUuid = firstReplyResponse.body.data.uuid;

      // Create nested reply (reply to the first reply)
      const nestedReplyResponse = await request(app.getHttpServer())
        .post(`/api/v1/pages/${pageUuid}/comments`)
        .set('Authorization', `Bearer ${accessToken}`)
        .send({
          content: 'Nested reply',
          parent_comment_id: firstReplyUuid,
        })
        .expect(201);

      expect(nestedReplyResponse.body.data.parent_comment_id).toBe(firstReplyUuid);

      // Verify structure
      const parentComment = await prisma.comment.findUnique({
        where: { uuid: parentUuid },
        include: {
          childComments: {
            include: {
              childComments: true,
            },
          },
        },
      });
      expect(parentComment?.childComments.length).toBeGreaterThanOrEqual(1);
      const firstReply = parentComment?.childComments.find(c => c.uuid === firstReplyUuid);
      expect(firstReply?.childComments.length).toBeGreaterThanOrEqual(1);
    });

    it('should fail when parent comment not found', async () => {
      const fakeParentUuid = '00000000-0000-0000-0000-000000000000';

      const response = await request(app.getHttpServer())
        .post(`/api/v1/pages/${pageUuid}/comments`)
        .set('Authorization', `Bearer ${accessToken}`)
        .send({
          content: 'Reply to non-existent parent',
          parent_comment_id: fakeParentUuid,
        })
        .expect(400);

      expect(response.body.success).toBe(false);
    });

    it('should fail when parent comment is on different page', async () => {
      // Create another page
      const otherPage = await prisma.page.create({
        data: {
          workspaceId: (await prisma.workspace.findUnique({ where: { uuid: workspaceUuid } }))!.id,
          createdById: (await prisma.user.findUnique({ where: { uuid: userId } }))!.id,
          lastEditedById: (await prisma.user.findUnique({ where: { uuid: userId } }))!.id,
          title: 'Other Page',
          allowComments: true,
        },
      });

      // Create comment on other page
      const otherCommentResponse = await request(app.getHttpServer())
        .post(`/api/v1/pages/${otherPage.uuid}/comments`)
        .set('Authorization', `Bearer ${accessToken}`)
        .send({ content: 'Comment on other page' })
        .expect(201);

      const otherCommentUuid = otherCommentResponse.body.data.uuid;

      // Try to reply from current page
      const response = await request(app.getHttpServer())
        .post(`/api/v1/pages/${pageUuid}/comments`)
        .set('Authorization', `Bearer ${accessToken}`)
        .send({
          content: 'Reply to comment on different page',
          parent_comment_id: otherCommentUuid,
        })
        .expect(400);

      expect(response.body.success).toBe(false);

      // Clean up
      await prisma.comment.deleteMany({ where: { pageId: otherPage.id } });
      await prisma.page.delete({ where: { id: otherPage.id } });
    });

    it('should retrieve comments with thread structure', async () => {
      // Create parent
      const parentResponse = await request(app.getHttpServer())
        .post(`/api/v1/pages/${pageUuid}/comments`)
        .set('Authorization', `Bearer ${accessToken}`)
        .send({ content: 'Parent for retrieval test' })
        .expect(201);

      const parentUuid = parentResponse.body.data.uuid;

      // Create replies
      await request(app.getHttpServer())
        .post(`/api/v1/pages/${pageUuid}/comments`)
        .set('Authorization', `Bearer ${accessToken}`)
        .send({
          content: 'Reply 1',
          parent_comment_id: parentUuid,
        })
        .expect(201);

      await request(app.getHttpServer())
        .post(`/api/v1/pages/${pageUuid}/comments`)
        .set('Authorization', `Bearer ${accessToken}`)
        .send({
          content: 'Reply 2',
          parent_comment_id: parentUuid,
        })
        .expect(201);

      // Get all comments
      const getResponse = await request(app.getHttpServer())
        .get(`/api/v1/pages/${pageUuid}/comments`)
        .set('Authorization', `Bearer ${accessToken}`)
        .expect(200);

      expect(getResponse.body.success).toBe(true);
      expect(getResponse.body.data).toBeInstanceOf(Array);
      
      const parentComment = getResponse.body.data.find((c: any) => c.uuid === parentUuid);
      expect(parentComment).toBeDefined();
      expect(parentComment.child_comments).toBeDefined();
      expect(parentComment.child_comments.length).toBeGreaterThanOrEqual(2);
    });
  });
});

