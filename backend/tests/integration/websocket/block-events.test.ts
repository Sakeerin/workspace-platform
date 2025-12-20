import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import { Server as HTTPServer } from 'http';
import { Server as SocketIOServer } from 'socket.io';
import { io, Socket } from 'socket.io-client';
import { AppModule } from '../../../src/app.module';
import { setupSocketIO } from '../../../src/websocket/socket.config';
import { WebSocketGateway } from '../../../src/websocket/gateway';
import { JWTService } from '../../../src/utils/jwt';
import { PrismaClient } from '@prisma/client';
import { EncryptionService } from '../../../src/utils/encryption';

describe('WebSocket Block Events (Integration)', () => {
  let app: INestApplication;
  let httpServer: HTTPServer;
  let ioServer: SocketIOServer;
  let gateway: WebSocketGateway;
  let prisma: PrismaClient;
  let testUser1: { id: bigint; uuid: string; email: string };
  let testUser2: { id: bigint; uuid: string; email: string };
  let testWorkspace: { id: bigint; uuid: string };
  let testPage: { id: bigint; uuid: string };
  let testBlock: { id: bigint; uuid: string };
  let accessToken1: string;
  let accessToken2: string;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    await app.init();

    httpServer = app.getHttpServer() as HTTPServer;
    ioServer = setupSocketIO(httpServer);
    gateway = new WebSocketGateway(ioServer);

    prisma = new PrismaClient();

    // Create test users
    const passwordHash = await EncryptionService.hashPassword('password123');
    testUser1 = await prisma.user.create({
      data: {
        email: 'test-block-events-1@example.com',
        passwordHash,
        name: 'Test Block Events User 1',
        isActive: true,
      },
    });

    testUser2 = await prisma.user.create({
      data: {
        email: 'test-block-events-2@example.com',
        passwordHash,
        name: 'Test Block Events User 2',
        isActive: true,
      },
    });

    // Create test workspace
    testWorkspace = await prisma.workspace.create({
      data: {
        name: 'Test Block Events Workspace',
        slug: 'test-block-events-workspace',
      },
    });

    // Add users to workspace
    await prisma.workspaceMember.createMany({
      data: [
        {
          workspaceId: testWorkspace.id,
          userId: testUser1.id,
          role: 'owner',
        },
        {
          workspaceId: testWorkspace.id,
          userId: testUser2.id,
          role: 'member',
        },
      ],
    });

    // Create test page
    testPage = await prisma.page.create({
      data: {
        workspaceId: testWorkspace.id,
        createdById: testUser1.id,
        lastEditedById: testUser1.id,
        title: 'Test Block Events Page',
      },
    });

    // Create test block
    testBlock = await prisma.block.create({
      data: {
        pageId: testPage.id,
        createdById: testUser1.id,
        lastEditedById: testUser1.id,
        type: 'paragraph',
        content: { text: 'Initial content' },
        contentText: 'Initial content',
        position: 0,
        depth: 0,
      },
    });

    // Generate access tokens
    accessToken1 = JWTService.generateAccessToken({
      userId: testUser1.id.toString(),
      email: testUser1.email,
    });

    accessToken2 = JWTService.generateAccessToken({
      userId: testUser2.id.toString(),
      email: testUser2.email,
    });
  });

  afterAll(async () => {
    await prisma.block.deleteMany({
      where: {
        pageId: testPage.id,
      },
    });
    await prisma.page.deleteMany({
      where: {
        workspaceId: testWorkspace.id,
      },
    });
    await prisma.workspaceMember.deleteMany({
      where: {
        workspaceId: testWorkspace.id,
      },
    });
    await prisma.workspace.delete({
      where: { id: testWorkspace.id },
    });
    await prisma.user.deleteMany({
      where: {
        email: {
          contains: 'test-block-events',
        },
      },
    });
    await prisma.$disconnect();
    ioServer.close();
    await app.close();
  });

  describe('Block Update Events', () => {
    it('should broadcast block update to all users on page', (done) => {
      const client1: Socket = io('http://localhost:3000', {
        auth: {
          token: accessToken1,
        },
        transports: ['websocket', 'polling'],
      });

      const client2: Socket = io('http://localhost:3000', {
        auth: {
          token: accessToken2,
        },
        transports: ['websocket', 'polling'],
      });

      client1.on('connect', () => {
        client1.emit('join_page', { page_id: testPage.uuid });
      });

      client2.on('connect', () => {
        client2.emit('join_page', { page_id: testPage.uuid });

        client2.on('block_updated', (data) => {
          expect(data).toHaveProperty('block');
          expect(data).toHaveProperty('page_id');
          expect(data.block.uuid).toBe(testBlock.uuid);
          expect(data.block.content.text).toBe('Updated content');
          expect(data.page_id).toBe(testPage.uuid);
          client1.disconnect();
          client2.disconnect();
          done();
        });

        // Wait a bit then broadcast update
        setTimeout(() => {
          gateway.broadcastToPage(testPage.uuid, 'block_updated', {
            block: {
              uuid: testBlock.uuid,
              type: 'paragraph',
              content: { text: 'Updated content' },
              updated_at: new Date().toISOString(),
            },
            page_id: testPage.uuid,
            user_id: testUser1.uuid,
          });
        }, 500);
      });
    });

    it('should broadcast block created event', (done) => {
      const client1: Socket = io('http://localhost:3000', {
        auth: {
          token: accessToken1,
        },
        transports: ['websocket', 'polling'],
      });

      const client2: Socket = io('http://localhost:3000', {
        auth: {
          token: accessToken2,
        },
        transports: ['websocket', 'polling'],
      });

      client1.on('connect', () => {
        client1.emit('join_page', { page_id: testPage.uuid });
      });

      client2.on('connect', () => {
        client2.emit('join_page', { page_id: testPage.uuid });

        client2.on('block_created', (data) => {
          expect(data).toHaveProperty('block');
          expect(data).toHaveProperty('page_id');
          expect(data.block.type).toBe('paragraph');
          expect(data.page_id).toBe(testPage.uuid);
          client1.disconnect();
          client2.disconnect();
          done();
        });

        // Wait a bit then broadcast create
        setTimeout(() => {
          gateway.broadcastToPage(testPage.uuid, 'block_created', {
            block: {
              uuid: 'new-block-uuid',
              type: 'paragraph',
              content: { text: 'New block' },
              position: 1,
              created_at: new Date().toISOString(),
            },
            page_id: testPage.uuid,
            user_id: testUser1.uuid,
          });
        }, 500);
      });
    });

    it('should broadcast block deleted event', (done) => {
      const client1: Socket = io('http://localhost:3000', {
        auth: {
          token: accessToken1,
        },
        transports: ['websocket', 'polling'],
      });

      const client2: Socket = io('http://localhost:3000', {
        auth: {
          token: accessToken2,
        },
        transports: ['websocket', 'polling'],
      });

      client1.on('connect', () => {
        client1.emit('join_page', { page_id: testPage.uuid });
      });

      client2.on('connect', () => {
        client2.emit('join_page', { page_id: testPage.uuid });

        client2.on('block_deleted', (data) => {
          expect(data).toHaveProperty('block_uuid');
          expect(data).toHaveProperty('page_id');
          expect(data.block_uuid).toBe(testBlock.uuid);
          expect(data.page_id).toBe(testPage.uuid);
          client1.disconnect();
          client2.disconnect();
          done();
        });

        // Wait a bit then broadcast delete
        setTimeout(() => {
          gateway.broadcastToPage(testPage.uuid, 'block_deleted', {
            block_uuid: testBlock.uuid,
            page_id: testPage.uuid,
            user_id: testUser1.uuid,
          });
        }, 500);
      });
    });
  });
});

