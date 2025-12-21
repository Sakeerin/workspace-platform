import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import * as request from 'supertest';
import { AppModule } from '../../../src/app.module';
import { PrismaClient } from '@prisma/client';
import { EncryptionService } from '../../../src/utils/encryption';
import { JWTService } from '../../../src/utils/jwt';

describe('Database Creation (Integration)', () => {
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
        email: 'test-database@example.com',
        passwordHash,
        name: 'Test Database User',
        isActive: true,
      },
    });

    const workspace = await prisma.workspace.create({
      data: {
        name: 'Test Workspace',
        slug: 'test-workspace-database',
      },
    });

    await prisma.workspaceMember.create({
      data: {
        workspaceId: workspace.id,
        userId: user.id,
        role: 'owner',
      },
    });

    // Create a page for the database
    const page = await prisma.page.create({
      data: {
        workspaceId: workspace.id,
        createdById: user.id,
        lastEditedById: user.id,
        title: 'Database Page',
        type: 'database',
        databaseType: 'table',
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
    await prisma.databaseRow.deleteMany({
      where: {
        database: {
          page: {
            workspace: {
              uuid: workspaceUuid,
            },
          },
        },
      },
    });
    await prisma.database.deleteMany({
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
        email: 'test-database@example.com',
      },
    });
    await prisma.$disconnect();
    await app.close();
  });

  beforeEach(async () => {
    // Clean up databases before each test
    await prisma.databaseRow.deleteMany({
      where: {
        database: {
          page: {
            workspace: {
              uuid: workspaceUuid,
            },
          },
        },
      },
    });
    await prisma.database.deleteMany({
      where: {
        page: {
          workspace: {
            uuid: workspaceUuid,
          },
        },
      },
    });
  });

  describe('POST /api/v1/databases', () => {
    it('should create a database successfully', async () => {
      const databaseData = {
        page_id: pageUuid,
        title: 'Test Database',
        properties: {
          title: { type: 'title', name: 'Name' },
        },
        views: [],
      };

      const response = await request(app.getHttpServer())
        .post('/api/v1/databases')
        .set('Authorization', `Bearer ${accessToken}`)
        .send(databaseData)
        .expect(201);

      expect(response.body).toHaveProperty('success', true);
      expect(response.body.data).toHaveProperty('uuid');
      expect(response.body.data.title).toBe(databaseData.title);
      expect(response.body.data.properties).toEqual(databaseData.properties);

      // Verify database exists in database
      const database = await prisma.database.findUnique({
        where: { uuid: response.body.data.uuid },
      });
      expect(database).toBeDefined();
      expect(database?.title).toBe(databaseData.title);
    });

    it('should create a database with views', async () => {
      const databaseData = {
        page_id: pageUuid,
        title: 'Database with Views',
        properties: {
          title: { type: 'title', name: 'Name' },
          status: { type: 'select', name: 'Status', options: ['Todo', 'Done'] },
        },
        views: [
          {
            id: 'view1',
            type: 'table',
            name: 'Table View',
            filters: [],
            sorts: [],
          },
          {
            id: 'view2',
            type: 'board',
            name: 'Board View',
            filters: [],
            sorts: [],
          },
        ],
        default_view_id: 'view1',
      };

      const response = await request(app.getHttpServer())
        .post('/api/v1/databases')
        .set('Authorization', `Bearer ${accessToken}`)
        .send(databaseData)
        .expect(201);

      expect(response.body.data.views).toHaveLength(2);
      expect(response.body.data.default_view_id).toBe('view1');
    });

    it('should fail without authentication', async () => {
      const databaseData = {
        page_id: pageUuid,
        title: 'Unauthorized Database',
      };

      const response = await request(app.getHttpServer())
        .post('/api/v1/databases')
        .send(databaseData)
        .expect(401);

      expect(response.body.success).toBe(false);
    });

    it('should fail with missing required fields', async () => {
      const response = await request(app.getHttpServer())
        .post('/api/v1/databases')
        .set('Authorization', `Bearer ${accessToken}`)
        .send({})
        .expect(400);

      expect(response.body.success).toBe(false);
    });

    it('should fail when page not found', async () => {
      const fakeUuid = '00000000-0000-0000-0000-000000000000';
      const databaseData = {
        page_id: fakeUuid,
        title: 'Test Database',
      };

      const response = await request(app.getHttpServer())
        .post('/api/v1/databases')
        .set('Authorization', `Bearer ${accessToken}`)
        .send(databaseData)
        .expect(404);

      expect(response.body.success).toBe(false);
    });

    it('should set default values for new database', async () => {
      const databaseData = {
        page_id: pageUuid,
        title: 'Default Database',
      };

      const response = await request(app.getHttpServer())
        .post('/api/v1/databases')
        .set('Authorization', `Bearer ${accessToken}`)
        .send(databaseData)
        .expect(201);

      const database = await prisma.database.findUnique({
        where: { uuid: response.body.data.uuid },
      });

      expect(database?.properties).toBeDefined();
      expect(Array.isArray(database?.views)).toBe(true);
      expect(database?.deletedAt).toBeNull();
    });
  });
});

