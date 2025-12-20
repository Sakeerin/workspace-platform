import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import * as request from 'supertest';
import { AppModule } from '../../../src/app.module';
import { PrismaClient } from '@prisma/client';
import { EncryptionService } from '../../../src/utils/encryption';
import { JWTService } from '../../../src/utils/jwt';

describe('Block Creation (Integration)', () => {
  let app: INestApplication;
  let prisma: PrismaClient;
  let accessToken: string;
  let userId: string;
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
        email: 'test-block@example.com',
        passwordHash,
        name: 'Test Block User',
        isActive: true,
      },
    });

    const workspace = await prisma.workspace.create({
      data: {
        name: 'Test Workspace',
        slug: 'test-workspace-block',
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
        title: 'Test Page',
      },
    });

    userId = user.uuid;
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
          email: 'test-block@example.com',
        },
      },
    });
    await prisma.workspace.deleteMany({
      where: {
        members: {
          some: {
            user: {
              email: 'test-block@example.com',
            },
          },
        },
      },
    });
    await prisma.user.deleteMany({
      where: {
        email: 'test-block@example.com',
      },
    });
    await prisma.$disconnect();
    await app.close();
  });

  beforeEach(async () => {
    // Clean up blocks before each test
    await prisma.block.deleteMany({
      where: {
        page: {
          uuid: pageUuid,
        },
      },
    });
  });

  describe('POST /api/v1/pages/:uuid/blocks', () => {
    it('should create a block successfully', async () => {
      const blockData = {
        type: 'paragraph',
        content: { text: 'Hello world' },
      };

      const response = await request(app.getHttpServer())
        .post(`/api/v1/pages/${pageUuid}/blocks`)
        .set('Authorization', `Bearer ${accessToken}`)
        .send(blockData)
        .expect(201);

      expect(response.body).toHaveProperty('success', true);
      expect(response.body.data).toHaveProperty('uuid');
      expect(response.body.data.type).toBe(blockData.type);
      expect(response.body.data.content).toEqual(blockData.content);

      // Verify block exists in database
      const block = await prisma.block.findUnique({
        where: { uuid: response.body.data.uuid },
      });
      expect(block).toBeDefined();
      expect(block?.type).toBe(blockData.type);
    });

    it('should create different block types', async () => {
      const paragraphResponse = await request(app.getHttpServer())
        .post(`/api/v1/pages/${pageUuid}/blocks`)
        .set('Authorization', `Bearer ${accessToken}`)
        .send({
          type: 'paragraph',
          content: { text: 'Paragraph' },
        })
        .expect(201);

      const headingResponse = await request(app.getHttpServer())
        .post(`/api/v1/pages/${pageUuid}/blocks`)
        .set('Authorization', `Bearer ${accessToken}`)
        .send({
          type: 'heading1',
          content: { text: 'Heading' },
        })
        .expect(201);

      expect(paragraphResponse.body.data.type).toBe('paragraph');
      expect(headingResponse.body.data.type).toBe('heading1');
    });

    it('should create nested blocks with parent_block_id', async () => {
      // Create parent block
      const parentResponse = await request(app.getHttpServer())
        .post(`/api/v1/pages/${pageUuid}/blocks`)
        .set('Authorization', `Bearer ${accessToken}`)
        .send({
          type: 'toggle',
          content: { text: 'Toggle block' },
        })
        .expect(201);

      // Create child block
      const childResponse = await request(app.getHttpServer())
        .post(`/api/v1/pages/${pageUuid}/blocks`)
        .set('Authorization', `Bearer ${accessToken}`)
        .send({
          type: 'paragraph',
          content: { text: 'Child block' },
          parent_block_id: parentResponse.body.data.uuid,
        })
        .expect(201);

      expect(childResponse.body.data.parent_block_id).toBe(parentResponse.body.data.uuid);
      expect(childResponse.body.data.depth).toBeGreaterThan(0);

      // Verify in database
      const childBlock = await prisma.block.findUnique({
        where: { uuid: childResponse.body.data.uuid },
        include: { parentBlock: true },
      });
      expect(childBlock?.parentBlock?.uuid).toBe(parentResponse.body.data.uuid);
    });

    it('should set position correctly', async () => {
      const block1 = await request(app.getHttpServer())
        .post(`/api/v1/pages/${pageUuid}/blocks`)
        .set('Authorization', `Bearer ${accessToken}`)
        .send({
          type: 'paragraph',
          content: { text: 'First' },
          position: 0,
        })
        .expect(201);

      const block2 = await request(app.getHttpServer())
        .post(`/api/v1/pages/${pageUuid}/blocks`)
        .set('Authorization', `Bearer ${accessToken}`)
        .send({
          type: 'paragraph',
          content: { text: 'Second' },
          position: 1,
        })
        .expect(201);

      expect(block1.body.data.position).toBe(0);
      expect(block2.body.data.position).toBe(1);
    });

    it('should fail without authentication', async () => {
      const blockData = {
        type: 'paragraph',
        content: { text: 'Unauthorized' },
      };

      const response = await request(app.getHttpServer())
        .post(`/api/v1/pages/${pageUuid}/blocks`)
        .send(blockData)
        .expect(401);

      expect(response.body.success).toBe(false);
    });

    it('should fail with missing required fields', async () => {
      const response = await request(app.getHttpServer())
        .post(`/api/v1/pages/${pageUuid}/blocks`)
        .set('Authorization', `Bearer ${accessToken}`)
        .send({
          type: 'paragraph',
        })
        .expect(400);

      expect(response.body.success).toBe(false);
    });

    it('should fail when page not found', async () => {
      const fakeUuid = '00000000-0000-0000-0000-000000000000';
      const blockData = {
        type: 'paragraph',
        content: { text: 'Test' },
      };

      const response = await request(app.getHttpServer())
        .post(`/api/v1/pages/${fakeUuid}/blocks`)
        .set('Authorization', `Bearer ${accessToken}`)
        .send(blockData)
        .expect(404);

      expect(response.body.success).toBe(false);
    });

    it('should set default values for new block', async () => {
      const blockData = {
        type: 'paragraph',
        content: { text: 'Default block' },
      };

      const response = await request(app.getHttpServer())
        .post(`/api/v1/pages/${pageUuid}/blocks`)
        .set('Authorization', `Bearer ${accessToken}`)
        .send(blockData)
        .expect(201);

      const block = await prisma.block.findUnique({
        where: { uuid: response.body.data.uuid },
      });

      expect(block?.position).toBe(0);
      expect(block?.depth).toBe(0);
      expect(block?.properties).toBeDefined();
    });

    it('should set created_by and last_edited_by to current user', async () => {
      const blockData = {
        type: 'paragraph',
        content: { text: 'User block' },
      };

      const response = await request(app.getHttpServer())
        .post(`/api/v1/pages/${pageUuid}/blocks`)
        .set('Authorization', `Bearer ${accessToken}`)
        .send(blockData)
        .expect(201);

      const user = await prisma.user.findUnique({
        where: { uuid: userId },
      });

      const block = await prisma.block.findUnique({
        where: { uuid: response.body.data.uuid },
      });

      expect(block?.createdById).toBe(user?.id);
      expect(block?.lastEditedById).toBe(user?.id);
    });
  });
});

