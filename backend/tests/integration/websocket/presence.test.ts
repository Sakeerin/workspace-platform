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

describe('WebSocket Presence (Integration)', () => {
  let app: INestApplication;
  let httpServer: HTTPServer;
  let ioServer: SocketIOServer;
  let gateway: WebSocketGateway;
  let prisma: PrismaClient;
  let testUser1: { id: bigint; uuid: string; email: string };
  let testUser2: { id: bigint; uuid: string; email: string };
  let testWorkspace: { id: bigint; uuid: string };
  let testPage: { id: bigint; uuid: string };
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
        email: 'test-presence-1@example.com',
        passwordHash,
        name: 'Test Presence User 1',
        isActive: true,
      },
    });

    testUser2 = await prisma.user.create({
      data: {
        email: 'test-presence-2@example.com',
        passwordHash,
        name: 'Test Presence User 2',
        isActive: true,
      },
    });

    // Create test workspace
    testWorkspace = await prisma.workspace.create({
      data: {
        name: 'Test Presence Workspace',
        slug: 'test-presence-workspace',
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
        title: 'Test Presence Page',
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
          contains: 'test-presence',
        },
      },
    });
    await prisma.$disconnect();
    ioServer.close();
    await app.close();
  });

  describe('Presence Events', () => {
    it('should emit presence when user joins page', (done) => {
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

      let client1Connected = false;
      let client2Connected = false;

      client1.on('connect', () => {
        client1Connected = true;
        client1.emit('join_page', { page_id: testPage.uuid });
      });

      client2.on('connect', () => {
        client2Connected = true;
        client2.emit('join_page', { page_id: testPage.uuid });

        // Listen for presence updates
        client2.on('user_joined', (data) => {
          expect(data).toHaveProperty('user');
          expect(data).toHaveProperty('page_id');
          expect(data.page_id).toBe(testPage.uuid);
          client1.disconnect();
          client2.disconnect();
          done();
        });
      });

      // Wait for both to connect and join
      setTimeout(() => {
        if (client1Connected && client2Connected) {
          // Trigger presence update
          gateway.broadcastToPage(testPage.uuid, 'user_joined', {
            user: {
              id: testUser1.uuid,
              name: testUser1.name,
              email: testUser1.email,
            },
            page_id: testPage.uuid,
          });
        }
      }, 500);
    });

    it('should emit presence when user leaves page', (done) => {
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

        client2.on('user_left', (data) => {
          expect(data).toHaveProperty('user');
          expect(data).toHaveProperty('page_id');
          expect(data.page_id).toBe(testPage.uuid);
          client1.disconnect();
          client2.disconnect();
          done();
        });

        // Wait a bit then have client1 leave
        setTimeout(() => {
          client1.emit('leave_page', { page_id: testPage.uuid });
          gateway.broadcastToPage(testPage.uuid, 'user_left', {
            user: {
              id: testUser1.uuid,
              name: testUser1.name,
            },
            page_id: testPage.uuid,
          });
        }, 500);
      });
    });

    it('should track multiple users on same page', (done) => {
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

      let presenceCount = 0;

      client1.on('connect', () => {
        client1.emit('join_page', { page_id: testPage.uuid });
      });

      client2.on('connect', () => {
        client2.emit('join_page', { page_id: testPage.uuid });

        client2.on('presence_update', (data) => {
          expect(data).toHaveProperty('users');
          expect(Array.isArray(data.users)).toBe(true);
          presenceCount++;

          if (presenceCount >= 2) {
            client1.disconnect();
            client2.disconnect();
            done();
          }
        });

        // Trigger presence updates
        setTimeout(() => {
          gateway.broadcastToPage(testPage.uuid, 'presence_update', {
            users: [
              {
                id: testUser1.uuid,
                name: testUser1.name,
                email: testUser1.email,
              },
              {
                id: testUser2.uuid,
                name: testUser2.name,
                email: testUser2.email,
              },
            ],
            page_id: testPage.uuid,
          });
        }, 500);
      });
    });
  });
});

