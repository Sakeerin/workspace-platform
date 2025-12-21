import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import * as request from 'supertest';
import { AppModule } from '../../../src/app.module';
import { PrismaClient } from '@prisma/client';
import { EncryptionService } from '../../../src/utils/encryption';
import { JWTService } from '../../../src/utils/jwt';

/**
 * Contract tests for POST /api/v1/databases/:uuid/rows
 * These tests verify that the API implementation matches the OpenAPI specification
 */
describe('POST /api/v1/databases/:uuid/rows - Contract Tests', () => {
  let app: INestApplication;
  let prisma: PrismaClient;
  let accessToken: string;
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
        email: 'test-contract-db-rows@example.com',
        passwordHash,
        name: 'Contract Test User',
        isActive: true,
      },
    });

    const workspace = await prisma.workspace.create({
      data: {
        name: 'Contract Test Workspace',
        slug: 'contract-test-workspace-db',
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
        },
        views: [],
      },
    });

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
          uuid: databaseUuid,
        },
      },
    });
    await prisma.database.deleteMany({
      where: {
        uuid: databaseUuid,
      },
    });
    await prisma.page.deleteMany({
      where: {
        database: {
          uuid: databaseUuid,
        },
      },
    });
    await prisma.workspaceMember.deleteMany({
      where: {
        workspace: {
          pages: {
            some: {
              database: {
                uuid: databaseUuid,
              },
            },
          },
        },
      },
    });
    await prisma.workspace.deleteMany({
      where: {
        pages: {
          some: {
            database: {
              uuid: databaseUuid,
            },
          },
        },
      },
    });
    await prisma.user.deleteMany({
      where: {
        email: 'test-contract-db-rows@example.com',
      },
    });
    await prisma.$disconnect();
    await app.close();
  });

  beforeEach(async () => {
    await prisma.databaseRow.deleteMany({
      where: {
        database: {
          uuid: databaseUuid,
        },
      },
    });
  });

  describe('Request Contract', () => {
    it('should accept valid request body according to OpenAPI spec', async () => {
      const requestBody = {
        properties: {
          title: 'Contract Test Row',
        },
        position: 0,
      };

      const response = await request(app.getHttpServer())
        .post(`/api/v1/databases/${databaseUuid}/rows`)
        .set('Authorization', `Bearer ${accessToken}`)
        .send(requestBody)
        .expect(201);

      expect(response.body).toHaveProperty('success');
    });

    it('should reject request with missing required field: properties', async () => {
      const requestBody = {
        position: 0,
      };

      const response = await request(app.getHttpServer())
        .post(`/api/v1/databases/${databaseUuid}/rows`)
        .set('Authorization', `Bearer ${accessToken}`)
        .send(requestBody)
        .expect(400);

      expect(response.body.success).toBe(false);
    });

    it('should accept optional fields: page_id, properties_text, position', async () => {
      const requestBody = {
        properties: {
          title: 'Optional Fields Row',
          status: 'Todo',
        },
        properties_text: 'Optional Fields Row Todo',
        position: 1,
      };

      const response = await request(app.getHttpServer())
        .post(`/api/v1/databases/${databaseUuid}/rows`)
        .set('Authorization', `Bearer ${accessToken}`)
        .send(requestBody)
        .expect(201);

      expect(response.body.data.properties).toEqual(requestBody.properties);
      expect(response.body.data.position).toBe(requestBody.position);
    });
  });

  describe('Response Contract - 201 Created', () => {
    it('should return 201 status code on successful row creation', async () => {
      const requestBody = {
        properties: {
          title: 'Contract Test Row 201',
        },
      };

      const response = await request(app.getHttpServer())
        .post(`/api/v1/databases/${databaseUuid}/rows`)
        .set('Authorization', `Bearer ${accessToken}`)
        .send(requestBody)
        .expect(201);

      expect(response.status).toBe(201);
    });

    it('should return DatabaseRow schema according to OpenAPI spec', async () => {
      const requestBody = {
        properties: {
          title: 'Contract Test Row Schema',
        },
      };

      const response = await request(app.getHttpServer())
        .post(`/api/v1/databases/${databaseUuid}/rows`)
        .set('Authorization', `Bearer ${accessToken}`)
        .send(requestBody)
        .expect(201);

      // Verify DatabaseRow structure
      expect(response.body).toHaveProperty('success', true);
      expect(response.body).toHaveProperty('data');

      // Verify DatabaseRow schema properties
      const row = response.body.data;
      expect(row).toHaveProperty('uuid');
      expect(row).toHaveProperty('properties');
      expect(row).toHaveProperty('position');
      expect(typeof row.uuid).toBe('string');
      expect(typeof row.properties).toBe('object');
      expect(typeof row.position).toBe('number');
    });

    it('should return row properties matching request', async () => {
      const requestBody = {
        properties: {
          title: 'Contract Test Row Title',
          status: 'Todo',
        },
      };

      const response = await request(app.getHttpServer())
        .post(`/api/v1/databases/${databaseUuid}/rows`)
        .set('Authorization', `Bearer ${accessToken}`)
        .send(requestBody)
        .expect(201);

      expect(response.body.data.properties).toEqual(requestBody.properties);
    });

    it('should return default values when not provided', async () => {
      const requestBody = {
        properties: {
          title: 'Default Values Row',
        },
      };

      const response = await request(app.getHttpServer())
        .post(`/api/v1/databases/${databaseUuid}/rows`)
        .set('Authorization', `Bearer ${accessToken}`)
        .send(requestBody)
        .expect(201);

      expect(response.body.data.position).toBe(0);
    });
  });

  describe('Response Contract - 401 Unauthorized', () => {
    it('should return 401 when authentication is missing', async () => {
      const requestBody = {
        properties: {
          title: 'Unauthorized Row',
        },
      };

      const response = await request(app.getHttpServer())
        .post(`/api/v1/databases/${databaseUuid}/rows`)
        .send(requestBody)
        .expect(401);

      expect(response.status).toBe(401);
      expect(response.body.success).toBe(false);
    });

    it('should return error object with code and message', async () => {
      const requestBody = {
        properties: {
          title: 'Unauthorized Row',
        },
      };

      const response = await request(app.getHttpServer())
        .post(`/api/v1/databases/${databaseUuid}/rows`)
        .send(requestBody)
        .expect(401);

      expect(response.body.error).toHaveProperty('code');
      expect(response.body.error).toHaveProperty('message');
    });
  });

  describe('Response Contract - 404 Not Found', () => {
    it('should return 404 when database not found', async () => {
      const fakeUuid = '00000000-0000-0000-0000-000000000000';
      const requestBody = {
        properties: {
          title: 'Not Found Row',
        },
      };

      const response = await request(app.getHttpServer())
        .post(`/api/v1/databases/${fakeUuid}/rows`)
        .set('Authorization', `Bearer ${accessToken}`)
        .send(requestBody)
        .expect(404);

      expect(response.status).toBe(404);
      expect(response.body.success).toBe(false);
    });
  });

  describe('Content-Type Contract', () => {
    it('should accept application/json content type', async () => {
      const requestBody = {
        properties: {
          title: 'Content Type Test Row',
        },
      };

      const response = await request(app.getHttpServer())
        .post(`/api/v1/databases/${databaseUuid}/rows`)
        .set('Authorization', `Bearer ${accessToken}`)
        .set('Content-Type', 'application/json')
        .send(requestBody)
        .expect(201);

      expect(response.headers['content-type']).toMatch(/application\/json/);
    });
  });
});

