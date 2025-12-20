import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import * as request from 'supertest';
import { AppModule } from '../../../src/app.module';
import { PrismaClient } from '@prisma/client';
import { EncryptionService } from '../../../src/utils/encryption';
import { JWTService } from '../../../src/utils/jwt';

describe('Block Update (Integration)', () => {
  let app: INestApplication;
  let prisma: PrismaClient;
  let accessToken: string;
  let userId: string;
  let pageUuid: string;
  let blockUuid: string;

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

    // Create test user, workspace, page, and block
    const passwordHash = await EncryptionService.hashPassword('password123');
    const user = await prisma.user.create({
      data: {
        email: 'test-block-update@example.com',
        passwordHash,
        name: 'Test Block Update User',
        isActive: true,
      },
    });

    const workspace = await prisma.workspace.create({
      data: {
        name: 'Test Workspace',
        slug: 'test-workspace-block-update',
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

    const block = await prisma.block.create({
      data: {
        pageId: page.id,
        createdById: user.id,
        lastEditedById: user.id,
        type: 'paragraph',
        content: { text: 'Original text' },
      },
    });

    userId = user.uuid;
    pageUuid = page.uuid;
    blockUuid = block.uuid;
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
          email: 'test-block-update@example.com',
        },
      },
    });
    await prisma.workspace.deleteMany({
      where: {
        members: {
          some: {
            user: {
              email: 'test-block-update@example.com',
            },
          },
        },
      },
    });
    await prisma.user.deleteMany({
      where: {
        email: 'test-block-update@example.com',
      },
    });
    await prisma.$disconnect();
    await app.close();
  });

  describe('PATCH /api/v1/pages/:uuid/blocks/:blockUuid', () => {
    it('should update block content successfully', async () => {
      const updateData = {
        content: { text: 'Updated text' },
      };

      const response = await request(app.getHttpServer())
        .patch(`/api/v1/pages/${pageUuid}/blocks/${blockUuid}`)
        .set('Authorization', `Bearer ${accessToken}`)
        .send(updateData)
        .expect(200);

      expect(response.body).toHaveProperty('success', true);
      expect(response.body.data.content.text).toBe('Updated text');

      // Verify in database
      const block = await prisma.block.findUnique({
        where: { uuid: blockUuid },
      });
      expect(block?.content).toEqual({ text: 'Updated text' });
    });

    it('should update block properties', async () => {
      const updateData = {
        properties: { color: 'blue', alignment: 'center' },
      };

      const response = await request(app.getHttpServer())
        .patch(`/api/v1/pages/${pageUuid}/blocks/${blockUuid}`)
        .set('Authorization', `Bearer ${accessToken}`)
        .send(updateData)
        .expect(200);

      expect(response.body.data.properties.color).toBe('blue');
      expect(response.body.data.properties.alignment).toBe('center');
    });

    it('should update both content and properties', async () => {
      const updateData = {
        content: { text: 'New content' },
        properties: { color: 'red' },
      };

      const response = await request(app.getHttpServer())
        .patch(`/api/v1/pages/${pageUuid}/blocks/${blockUuid}`)
        .set('Authorization', `Bearer ${accessToken}`)
        .send(updateData)
        .expect(200);

      expect(response.body.data.content.text).toBe('New content');
      expect(response.body.data.properties.color).toBe('red');
    });

    it('should update last_edited_by to current user', async () => {
      const updateData = {
        content: { text: 'Edited by user' },
      };

      await request(app.getHttpServer())
        .patch(`/api/v1/pages/${pageUuid}/blocks/${blockUuid}`)
        .set('Authorization', `Bearer ${accessToken}`)
        .send(updateData)
        .expect(200);

      const user = await prisma.user.findUnique({
        where: { uuid: userId },
      });

      const block = await prisma.block.findUnique({
        where: { uuid: blockUuid },
      });

      expect(block?.lastEditedById).toBe(user?.id);
    });

    it('should fail without authentication', async () => {
      const updateData = {
        content: { text: 'Unauthorized update' },
      };

      const response = await request(app.getHttpServer())
        .patch(`/api/v1/pages/${pageUuid}/blocks/${blockUuid}`)
        .send(updateData)
        .expect(401);

      expect(response.body.success).toBe(false);
    });

    it('should fail when block not found', async () => {
      const fakeUuid = '00000000-0000-0000-0000-000000000000';
      const updateData = {
        content: { text: 'Test' },
      };

      const response = await request(app.getHttpServer())
        .patch(`/api/v1/pages/${pageUuid}/blocks/${fakeUuid}`)
        .set('Authorization', `Bearer ${accessToken}`)
        .send(updateData)
        .expect(404);

      expect(response.body.success).toBe(false);
    });

    it('should fail when page not found', async () => {
      const fakePageUuid = '00000000-0000-0000-0000-000000000000';
      const updateData = {
        content: { text: 'Test' },
      };

      const response = await request(app.getHttpServer())
        .patch(`/api/v1/pages/${fakePageUuid}/blocks/${blockUuid}`)
        .set('Authorization', `Bearer ${accessToken}`)
        .send(updateData)
        .expect(404);

      expect(response.body.success).toBe(false);
    });

    it('should preserve existing fields when only updating specific fields', async () => {
      // First update content
      await request(app.getHttpServer())
        .patch(`/api/v1/pages/${pageUuid}/blocks/${blockUuid}`)
        .set('Authorization', `Bearer ${accessToken}`)
        .send({
          content: { text: 'Preserve test' },
          properties: { color: 'green' },
        })
        .expect(200);

      // Then update only properties
      const response = await request(app.getHttpServer())
        .patch(`/api/v1/pages/${pageUuid}/blocks/${blockUuid}`)
        .set('Authorization', `Bearer ${accessToken}`)
        .send({
          properties: { alignment: 'left' },
        })
        .expect(200);

      // Content should be preserved, properties should be merged
      expect(response.body.data.content.text).toBe('Preserve test');
      expect(response.body.data.properties.color).toBe('green');
      expect(response.body.data.properties.alignment).toBe('left');
    });
  });
});

