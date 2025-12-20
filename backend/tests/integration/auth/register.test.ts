import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import * as request from 'supertest';
import { AppModule } from '../../../src/app.module';
import { PrismaClient } from '@prisma/client';

describe('Auth Registration (Integration)', () => {
  let app: INestApplication;
  let prisma: PrismaClient;

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
  });

  afterAll(async () => {
    // Clean up test data
    await prisma.workspaceMember.deleteMany({
      where: {
        workspace: {
          name: {
            contains: "Test User",
          },
        },
      },
    });
    await prisma.workspace.deleteMany({
      where: {
        name: {
          contains: "Test User",
        },
      },
    });
    await prisma.user.deleteMany({
      where: {
        email: {
          contains: 'test-register',
        },
      },
    });
    await prisma.$disconnect();
    await app.close();
  });

  beforeEach(async () => {
    // Clean up before each test
    await prisma.workspaceMember.deleteMany({
      where: {
        workspace: {
          name: {
            contains: "Test User",
          },
        },
      },
    });
    await prisma.workspace.deleteMany({
      where: {
        name: {
          contains: "Test User",
        },
      },
    });
    await prisma.user.deleteMany({
      where: {
        email: {
          contains: 'test-register',
        },
      },
    });
  });

  describe('POST /api/v1/auth/register', () => {
    it('should register a new user successfully', async () => {
      const registerData = {
        email: 'test-register@example.com',
        password: 'password123',
        name: 'Test User',
      };

      const response = await request(app.getHttpServer())
        .post('/api/v1/auth/register')
        .send(registerData)
        .expect(201);

      expect(response.body).toHaveProperty('success', true);
      expect(response.body.data).toHaveProperty('user');
      expect(response.body.data).toHaveProperty('tokens');
      expect(response.body.data.user).toHaveProperty('uuid');
      expect(response.body.data.user.email).toBe(registerData.email);
      expect(response.body.data.user.name).toBe(registerData.name);
      expect(response.body.data.tokens).toHaveProperty('access_token');
      expect(response.body.data.tokens).toHaveProperty('refresh_token');

      // Verify user exists in database
      const user = await prisma.user.findUnique({
        where: { email: registerData.email },
      });
      expect(user).toBeDefined();
      expect(user?.name).toBe(registerData.name);

      // Verify default workspace was created
      const workspace = await prisma.workspace.findFirst({
        where: {
          members: {
            some: {
              userId: user!.id,
              role: 'owner',
            },
          },
        },
      });
      expect(workspace).toBeDefined();
    });

    it('should fail when email already exists', async () => {
      const registerData = {
        email: 'test-register-duplicate@example.com',
        password: 'password123',
        name: 'Test User',
      };

      // First registration
      await request(app.getHttpServer())
        .post('/api/v1/auth/register')
        .send(registerData)
        .expect(201);

      // Second registration with same email
      const response = await request(app.getHttpServer())
        .post('/api/v1/auth/register')
        .send(registerData)
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.error.message).toContain('already exists');
    });

    it('should fail with invalid email format', async () => {
      const registerData = {
        email: 'invalid-email',
        password: 'password123',
        name: 'Test User',
      };

      const response = await request(app.getHttpServer())
        .post('/api/v1/auth/register')
        .send(registerData)
        .expect(400);

      expect(response.body.success).toBe(false);
    });

    it('should fail with password too short', async () => {
      const registerData = {
        email: 'test-register-short@example.com',
        password: 'short',
        name: 'Test User',
      };

      const response = await request(app.getHttpServer())
        .post('/api/v1/auth/register')
        .send(registerData)
        .expect(400);

      expect(response.body.success).toBe(false);
    });

    it('should fail with missing required fields', async () => {
      const response = await request(app.getHttpServer())
        .post('/api/v1/auth/register')
        .send({
          email: 'test-register-missing@example.com',
        })
        .expect(400);

      expect(response.body.success).toBe(false);
    });

    it('should hash password before storing', async () => {
      const registerData = {
        email: 'test-register-hash@example.com',
        password: 'password123',
        name: 'Test User',
      };

      await request(app.getHttpServer())
        .post('/api/v1/auth/register')
        .send(registerData)
        .expect(201);

      const user = await prisma.user.findUnique({
        where: { email: registerData.email },
      });

      expect(user?.passwordHash).toBeDefined();
      expect(user?.passwordHash).not.toBe(registerData.password);
      expect(user?.passwordHash.length).toBeGreaterThan(20); // Bcrypt hashes are long
    });

    it('should create default workspace for new user', async () => {
      const registerData = {
        email: 'test-register-workspace@example.com',
        password: 'password123',
        name: 'Test User Workspace',
      };

      await request(app.getHttpServer())
        .post('/api/v1/auth/register')
        .send(registerData)
        .expect(201);

      const user = await prisma.user.findUnique({
        where: { email: registerData.email },
      });

      const workspaceMember = await prisma.workspaceMember.findFirst({
        where: {
          userId: user!.id,
          role: 'owner',
        },
        include: {
          workspace: true,
        },
      });

      expect(workspaceMember).toBeDefined();
      expect(workspaceMember?.workspace.name).toContain(registerData.name);
    });
  });
});

