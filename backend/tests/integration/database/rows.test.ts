import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import * as request from 'supertest';
import { AppModule } from '../../../src/app.module';
import { PrismaClient } from '@prisma/client';
import { EncryptionService } from '../../../src/utils/encryption';
import { JWTService } from '../../../src/utils/jwt';

describe('Database Row Operations (Integration)', () => {
  let app: INestApplication;
  let prisma: PrismaClient;
  let accessToken: string;
  let userId: string;
  let workspaceUuid: string;
  let databaseUuid: string;

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
        email: 'test-db-rows@example.com',
        passwordHash,
        name: 'Test Database Rows User',
        isActive: true,
      },
    });

    const workspace = await prisma.workspace.create({
      data: {
        name: 'Test Workspace',
        slug: 'test-workspace-db-rows',
      },
    });

    await prisma.workspaceMember.create({
      data: {
        workspaceId: workspace.id,
        userId: user.id,
        role: 'owner',
      },
    });

    // Create a page and database
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

    const database = await prisma.database.create({
      data: {
        pageId: page.id,
        workspaceId: workspace.id,
        title: 'Test Database',
        properties: {
          title: { type: 'title', name: 'Name' },
          status: { type: 'select', name: 'Status', options: ['Todo', 'Done'] },
        },
        views: [],
      },
    });

    userId = user.uuid;
    workspaceUuid = workspace.uuid;
    databaseUuid = database.uuid;
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
          workspace: {
            uuid: workspaceUuid,
          },
        },
      },
    });
    await prisma.database.deleteMany({
      where: {
        workspace: {
          uuid: workspaceUuid,
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
        email: 'test-db-rows@example.com',
      },
    });
    await prisma.$disconnect();
    await app.close();
  });

  beforeEach(async () => {
    // Clean up rows before each test
    await prisma.databaseRow.deleteMany({
      where: {
        database: {
          uuid: databaseUuid,
        },
      },
    });
  });

  describe('POST /api/v1/databases/:uuid/rows', () => {
    it('should create a row successfully', async () => {
      const rowData = {
        properties: {
          title: 'Test Row',
          status: 'Todo',
        },
        position: 0,
      };

      const response = await request(app.getHttpServer())
        .post(`/api/v1/databases/${databaseUuid}/rows`)
        .set('Authorization', `Bearer ${accessToken}`)
        .send(rowData)
        .expect(201);

      expect(response.body).toHaveProperty('success', true);
      expect(response.body.data).toHaveProperty('uuid');
      expect(response.body.data.properties).toEqual(rowData.properties);
      expect(response.body.data.position).toBe(rowData.position);

      // Verify row exists in database
      const row = await prisma.databaseRow.findUnique({
        where: { uuid: response.body.data.uuid },
      });
      expect(row).toBeDefined();
      expect(row?.properties).toEqual(rowData.properties);
    });

    it('should create multiple rows with correct positions', async () => {
      const row1Data = {
        properties: { title: 'Row 1' },
        position: 0,
      };

      const row2Data = {
        properties: { title: 'Row 2' },
        position: 1,
      };

      const response1 = await request(app.getHttpServer())
        .post(`/api/v1/databases/${databaseUuid}/rows`)
        .set('Authorization', `Bearer ${accessToken}`)
        .send(row1Data)
        .expect(201);

      const response2 = await request(app.getHttpServer())
        .post(`/api/v1/databases/${databaseUuid}/rows`)
        .set('Authorization', `Bearer ${accessToken}`)
        .send(row2Data)
        .expect(201);

      expect(response1.body.data.position).toBe(0);
      expect(response2.body.data.position).toBe(1);
    });

    it('should fail without authentication', async () => {
      const rowData = {
        properties: { title: 'Unauthorized Row' },
      };

      const response = await request(app.getHttpServer())
        .post(`/api/v1/databases/${databaseUuid}/rows`)
        .send(rowData)
        .expect(401);

      expect(response.body.success).toBe(false);
    });

    it('should fail when database not found', async () => {
      const fakeUuid = '00000000-0000-0000-0000-000000000000';
      const rowData = {
        properties: { title: 'Test Row' },
      };

      const response = await request(app.getHttpServer())
        .post(`/api/v1/databases/${fakeUuid}/rows`)
        .set('Authorization', `Bearer ${accessToken}`)
        .send(rowData)
        .expect(404);

      expect(response.body.success).toBe(false);
    });
  });

  describe('GET /api/v1/databases/:uuid/rows', () => {
    it('should get all rows for a database', async () => {
      // Create some rows
      await prisma.databaseRow.create({
        data: {
          databaseId: (await prisma.database.findUnique({ where: { uuid: databaseUuid } }))!.id,
          createdById: (await prisma.user.findUnique({ where: { uuid: userId } }))!.id,
          lastEditedById: (await prisma.user.findUnique({ where: { uuid: userId } }))!.id,
          properties: { title: 'Row 1' },
          position: 0,
        },
      });

      await prisma.databaseRow.create({
        data: {
          databaseId: (await prisma.database.findUnique({ where: { uuid: databaseUuid } }))!.id,
          createdById: (await prisma.user.findUnique({ where: { uuid: userId } }))!.id,
          lastEditedById: (await prisma.user.findUnique({ where: { uuid: userId } }))!.id,
          properties: { title: 'Row 2' },
          position: 1,
        },
      });

      const response = await request(app.getHttpServer())
        .get(`/api/v1/databases/${databaseUuid}/rows`)
        .set('Authorization', `Bearer ${accessToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.length).toBeGreaterThanOrEqual(2);
    });
  });

  describe('PUT /api/v1/databases/:uuid/rows/:rowUuid', () => {
    it('should update a row successfully', async () => {
      const database = await prisma.database.findUnique({ where: { uuid: databaseUuid } });
      const user = await prisma.user.findUnique({ where: { uuid: userId } });

      const row = await prisma.databaseRow.create({
        data: {
          databaseId: database!.id,
          createdById: user!.id,
          lastEditedById: user!.id,
          properties: { title: 'Original' },
          position: 0,
        },
      });

      const updateData = {
        properties: {
          title: 'Updated',
          status: 'Done',
        },
      };

      const response = await request(app.getHttpServer())
        .put(`/api/v1/databases/${databaseUuid}/rows/${row.uuid}`)
        .set('Authorization', `Bearer ${accessToken}`)
        .send(updateData)
        .expect(200);

      expect(response.body.data.properties.title).toBe('Updated');
      expect(response.body.data.properties.status).toBe('Done');
    });
  });

  describe('DELETE /api/v1/databases/:uuid/rows/:rowUuid', () => {
    it('should soft delete a row successfully', async () => {
      const database = await prisma.database.findUnique({ where: { uuid: databaseUuid } });
      const user = await prisma.user.findUnique({ where: { uuid: userId } });

      const row = await prisma.databaseRow.create({
        data: {
          databaseId: database!.id,
          createdById: user!.id,
          lastEditedById: user!.id,
          properties: { title: 'To Delete' },
          position: 0,
        },
      });

      const response = await request(app.getHttpServer())
        .delete(`/api/v1/databases/${databaseUuid}/rows/${row.uuid}`)
        .set('Authorization', `Bearer ${accessToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);

      // Verify soft delete
      const deletedRow = await prisma.databaseRow.findUnique({
        where: { uuid: row.uuid },
      });
      expect(deletedRow?.deletedAt).toBeDefined();
    });
  });
});

