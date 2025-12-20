import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import * as request from 'supertest';
import { AppModule } from '../../../src/app.module';
import { PrismaClient } from '@prisma/client';
import { EncryptionService } from '../../../src/utils/encryption';
import { JWTService } from '../../../src/utils/jwt';

describe('Workspace Creation (Integration)', () => {
  let app: INestApplication;
  let prisma: PrismaClient;
  let accessToken: string;
  let userId: string;

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

    // Create test user and get token
    const passwordHash = await EncryptionService.hashPassword('password123');
    const user = await prisma.user.create({
      data: {
        email: 'test-workspace@example.com',
        passwordHash,
        name: 'Test Workspace User',
        isActive: true,
      },
    });

    userId = user.uuid;
    const tokens = JWTService.generateTokenPair({
      userId: user.uuid,
      email: user.email,
    });
    accessToken = tokens.access_token;
  });

  afterAll(async () => {
    await prisma.workspaceMember.deleteMany({
      where: {
        workspace: {
          name: {
            contains: 'Test Workspace',
          },
        },
      },
    });
    await prisma.workspace.deleteMany({
      where: {
        name: {
          contains: 'Test Workspace',
        },
      },
    });
    await prisma.user.deleteMany({
      where: {
        email: {
          contains: 'test-workspace',
        },
      },
    });
    await prisma.$disconnect();
    await app.close();
  });

  beforeEach(async () => {
    // Clean up workspaces before each test
    await prisma.workspaceMember.deleteMany({
      where: {
        workspace: {
          name: {
            contains: 'Test Workspace',
          },
        },
      },
    });
    await prisma.workspace.deleteMany({
      where: {
        name: {
          contains: 'Test Workspace',
        },
      },
    });
  });

  describe('POST /api/v1/workspaces', () => {
    it('should create a workspace successfully', async () => {
      const workspaceData = {
        name: 'Test Workspace',
        slug: 'test-workspace-create',
      };

      const response = await request(app.getHttpServer())
        .post('/api/v1/workspaces')
        .set('Authorization', `Bearer ${accessToken}`)
        .send(workspaceData)
        .expect(201);

      expect(response.body).toHaveProperty('success', true);
      expect(response.body.data).toHaveProperty('uuid');
      expect(response.body.data.name).toBe(workspaceData.name);
      expect(response.body.data.slug).toBe(workspaceData.slug);

      // Verify workspace exists in database
      const workspace = await prisma.workspace.findUnique({
        where: { slug: workspaceData.slug },
      });
      expect(workspace).toBeDefined();
      expect(workspace?.name).toBe(workspaceData.name);

      // Verify creator is added as owner
      const user = await prisma.user.findUnique({
        where: { uuid: userId },
      });
      const member = await prisma.workspaceMember.findFirst({
        where: {
          workspaceId: workspace!.id,
          userId: user!.id,
        },
      });
      expect(member).toBeDefined();
      expect(member?.role).toBe('owner');
    });

    it('should generate slug automatically if not provided', async () => {
      const workspaceData = {
        name: 'Test Workspace Auto Slug',
      };

      const response = await request(app.getHttpServer())
        .post('/api/v1/workspaces')
        .set('Authorization', `Bearer ${accessToken}`)
        .send(workspaceData)
        .expect(201);

      expect(response.body.data.slug).toBeDefined();
      expect(response.body.data.slug).toMatch(/^test-workspace-auto-slug/);
    });

    it('should create workspace with optional fields', async () => {
      const workspaceData = {
        name: 'Test Workspace Advanced',
        slug: 'test-workspace-advanced',
        icon: '🚀',
      };

      const response = await request(app.getHttpServer())
        .post('/api/v1/workspaces')
        .set('Authorization', `Bearer ${accessToken}`)
        .send(workspaceData)
        .expect(201);

      expect(response.body.data.icon).toBe(workspaceData.icon);
    });

    it('should fail when slug already exists', async () => {
      const workspaceData = {
        name: 'Test Workspace Duplicate',
        slug: 'test-workspace-duplicate-slug',
      };

      // Create first workspace
      await request(app.getHttpServer())
        .post('/api/v1/workspaces')
        .set('Authorization', `Bearer ${accessToken}`)
        .send(workspaceData)
        .expect(201);

      // Try to create with same slug
      const response = await request(app.getHttpServer())
        .post('/api/v1/workspaces')
        .set('Authorization', `Bearer ${accessToken}`)
        .send(workspaceData)
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.error.message).toContain('already exists');
    });

    it('should fail without authentication', async () => {
      const workspaceData = {
        name: 'Test Workspace Unauthorized',
        slug: 'test-workspace-unauthorized',
      };

      const response = await request(app.getHttpServer())
        .post('/api/v1/workspaces')
        .send(workspaceData)
        .expect(401);

      expect(response.body.success).toBe(false);
    });

    it('should fail with invalid token', async () => {
      const workspaceData = {
        name: 'Test Workspace Invalid Token',
        slug: 'test-workspace-invalid-token',
      };

      const response = await request(app.getHttpServer())
        .post('/api/v1/workspaces')
        .set('Authorization', 'Bearer invalid-token')
        .send(workspaceData)
        .expect(401);

      expect(response.body.success).toBe(false);
    });

    it('should fail with missing required fields', async () => {
      const response = await request(app.getHttpServer())
        .post('/api/v1/workspaces')
        .set('Authorization', `Bearer ${accessToken}`)
        .send({})
        .expect(400);

      expect(response.body.success).toBe(false);
    });

    it('should add creator as workspace owner', async () => {
      const workspaceData = {
        name: 'Test Workspace Owner Check',
        slug: 'test-workspace-owner-check',
      };

      const response = await request(app.getHttpServer())
        .post('/api/v1/workspaces')
        .set('Authorization', `Bearer ${accessToken}`)
        .send(workspaceData)
        .expect(201);

      const workspace = await prisma.workspace.findUnique({
        where: { uuid: response.body.data.uuid },
        include: {
          members: {
            include: {
              user: true,
            },
          },
        },
      });

      const ownerMember = workspace?.members.find((m) => m.role === 'owner');
      expect(ownerMember).toBeDefined();
      expect(ownerMember?.user.email).toBe('test-workspace@example.com');
    });

    it('should set default workspace properties', async () => {
      const workspaceData = {
        name: 'Test Workspace Defaults',
        slug: 'test-workspace-defaults',
      };

      const response = await request(app.getHttpServer())
        .post('/api/v1/workspaces')
        .set('Authorization', `Bearer ${accessToken}`)
        .send(workspaceData)
        .expect(201);

      const workspace = await prisma.workspace.findUnique({
        where: { uuid: response.body.data.uuid },
      });

      expect(workspace?.plan).toBe('free');
      expect(workspace?.isActive).toBe(true);
      expect(workspace?.maxMembers).toBe(10);
      expect(workspace?.maxStorageGb).toBe(5);
    });
  });
});

