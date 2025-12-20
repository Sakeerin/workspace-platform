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

describe('WebSocket Connection (Integration)', () => {
  let app: INestApplication;
  let httpServer: HTTPServer;
  let ioServer: SocketIOServer;
  let gateway: WebSocketGateway;
  let prisma: PrismaClient;
  let testUser: { id: bigint; uuid: string; email: string };
  let accessToken: string;

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

    // Create test user
    const passwordHash = await EncryptionService.hashPassword('password123');
    testUser = await prisma.user.create({
      data: {
        email: 'test-websocket@example.com',
        passwordHash,
        name: 'Test WebSocket User',
        isActive: true,
      },
    });

    // Generate access token
    accessToken = JWTService.generateAccessToken({
      userId: testUser.id.toString(),
      email: testUser.email,
    });
  });

  afterAll(async () => {
    await prisma.user.deleteMany({
      where: {
        email: {
          contains: 'test-websocket',
        },
      },
    });
    await prisma.$disconnect();
    ioServer.close();
    await app.close();
  });

  describe('WebSocket Connection', () => {
    it('should connect successfully with valid token', (done) => {
      const client: Socket = io('http://localhost:3000', {
        auth: {
          token: accessToken,
        },
        transports: ['websocket', 'polling'],
      });

      client.on('connect', () => {
        expect(client.connected).toBe(true);
        client.disconnect();
        done();
      });

      client.on('authenticated', (data) => {
        expect(data).toHaveProperty('user');
        expect(data.user.email).toBe(testUser.email);
      });

      client.on('connect_error', (error) => {
        done(error);
      });
    });

    it('should reject connection without token', (done) => {
      const client: Socket = io('http://localhost:3000', {
        transports: ['websocket', 'polling'],
      });

      client.on('connect', () => {
        // Should not connect
        done(new Error('Should not connect without token'));
      });

      client.on('disconnect', () => {
        expect(client.connected).toBe(false);
        done();
      });

      setTimeout(() => {
        if (!client.connected) {
          client.disconnect();
          done();
        }
      }, 1000);
    });

    it('should reject connection with invalid token', (done) => {
      const client: Socket = io('http://localhost:3000', {
        auth: {
          token: 'invalid-token',
        },
        transports: ['websocket', 'polling'],
      });

      client.on('connect', () => {
        done(new Error('Should not connect with invalid token'));
      });

      client.on('disconnect', () => {
        expect(client.connected).toBe(false);
        done();
      });

      setTimeout(() => {
        if (!client.connected) {
          client.disconnect();
          done();
        }
      }, 1000);
    });

    it('should handle reconnection', (done) => {
      const client: Socket = io('http://localhost:3000', {
        auth: {
          token: accessToken,
        },
        transports: ['websocket', 'polling'],
        reconnection: true,
        reconnectionDelay: 100,
      });

      let connected = false;
      let disconnected = false;

      client.on('connect', () => {
        connected = true;
        if (disconnected) {
          // Reconnected
          expect(client.connected).toBe(true);
          client.disconnect();
          done();
        } else {
          // First connection
          client.disconnect();
        }
      });

      client.on('disconnect', () => {
        disconnected = true;
        if (connected) {
          // Trigger reconnection
          setTimeout(() => {
            client.connect();
          }, 200);
        }
      });
    });
  });
});

