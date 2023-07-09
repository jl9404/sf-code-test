import { Test, TestingModule } from '@nestjs/testing';
import {
  ClassSerializerInterceptor,
  INestApplication,
  ValidationPipe,
  VersioningType,
} from '@nestjs/common';
import * as request from 'supertest';
import { AppModule } from '../src/app.module';
import { clearDb } from './helpers';
import { PRISMA_MASTER_CONNECTION } from 'src/common/prisma/constants';
import { ExtendedPrismaClient } from 'src/common/prisma/prisma.extension';
import * as argon2 from 'argon2';
import { JwtService } from '@nestjs/jwt';
import { User } from '@prisma/client';
import { Reflector, HttpAdapterHost } from '@nestjs/core';
import { PrismaClientExceptionFilter } from 'nestjs-prisma';
import { randomUUID } from 'crypto';

describe('TodoController (e2e)', () => {
  let app: INestApplication;
  let prisma: ExtendedPrismaClient;
  let user: User;
  let adminUser: User;
  let roUser: User;
  let token: string;
  let adminToken: string;
  let roToken: string;
  const future = +new Date() + 30 * 24 * 60 * 60 * 1000;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    app.useGlobalPipes(new ValidationPipe({ whitelist: true }));
    app.useGlobalInterceptors(
      new ClassSerializerInterceptor(app.get(Reflector)),
    );
    app.enableVersioning({
      type: VersioningType.URI,
    });
    const { httpAdapter } = app.get(HttpAdapterHost);
    app.useGlobalFilters(new PrismaClientExceptionFilter(httpAdapter));

    await app.init();

    prisma = app.get(PRISMA_MASTER_CONNECTION);
  });

  beforeEach(async () => {
    await clearDb(prisma);

    user = await prisma.user.upsert({
      where: {
        email: 'test@test.com',
      },
      create: {
        email: 'test@test.com',
        password: await argon2.hash('examplepassword'),
        roles: ['USER'],
      },
      update: {},
    });

    adminUser = await prisma.user.upsert({
      where: {
        email: 'admin@test.com',
      },
      create: {
        email: 'admin@test.com',
        password: await argon2.hash('examplepassword'),
        roles: ['ADMIN'],
      },
      update: {},
    });

    roUser = await prisma.user.upsert({
      where: {
        email: 'ro-user@test.com',
      },
      create: {
        email: 'ro-user@test.com',
        password: await argon2.hash('examplepassword'),
        roles: ['READONLY_USER'],
      },
      update: {},
    });

    token = app.get(JwtService).sign({
      sub: user.uuid,
    });

    adminToken = app.get(JwtService).sign({
      sub: adminUser.uuid,
    });

    roToken = app.get(JwtService).sign({
      sub: roUser.uuid,
    });
  });

  afterAll(async () => {
    await app.close();
  });

  describe('/v1/todos (POST)', () => {
    it('should create todo with minimal fields', async () => {
      const fixture = {
        name: 'todo from test',
        description: 'hahaha',
        dueAt: new Date(future).toISOString(),
      };

      await request(app.getHttpServer())
        .post('/v1/todos')
        .set('Authorization', `Bearer ${token}`)
        .send(fixture)
        .expect(201)
        .expect((res) => {
          expect(res.body.data.attributes.name).toEqual(fixture.name);
        });

      const activity = prisma.activity.findFirst({
        where: { actorId: user.id, model: 'Todo', action: 'CREATE' },
      });
      expect(activity).not.toBeNull();
    });

    it('should throw error if missing minimal data', async () => {
      return request(app.getHttpServer())
        .post('/v1/todos')
        .set('Authorization', `Bearer ${token}`)
        .send({})
        .expect(400)
        .expect((res) => {
          expect(res.body.message).toEqual([
            'name should not be empty',
            'name must be a string',
            'description should not be empty',
            'description must be a string',
            'dueAt should not be empty',
            'dueAt must be a Date instance',
            'minimal allowed date for dueAt is () => new Date()',
          ]);
        });
    });

    it('should throw error if dueAt is not future', async () => {
      const fixture = {
        name: 'todo from test',
        description: 'hahaha',
        dueAt: '2022-07-07T00:00:00.000Z',
      };

      return request(app.getHttpServer())
        .post('/v1/todos')
        .set('Authorization', `Bearer ${token}`)
        .send(fixture)
        .expect(400)
        .expect((res) => {
          expect(res.body.message).toContainEqual(
            'minimal allowed date for dueAt is () => new Date()',
          );
        });
    });

    it('should throw error if priority is not enum', async () => {
      const fixture = {
        name: 'todo from test',
        description: 'hahaha',
        priority: 'invalid',
        dueAt: new Date(future).toISOString(),
      };

      return request(app.getHttpServer())
        .post('/v1/todos')
        .set('Authorization', `Bearer ${token}`)
        .send(fixture)
        .expect(400)
        .expect((res) => {
          expect(res.body.message).toContainEqual(
            'priority must be one of the following values: P4, P3, P2, P1, P0',
          );
        });
    });

    it('should throw 403 for ro user', async () => {
      const fixture = {
        name: 'todo from test',
        description: 'hahaha',
        dueAt: new Date(future).toISOString(),
      };

      return await request(app.getHttpServer())
        .post(`/v1/todos`)
        .set('Authorization', `Bearer ${roToken}`)
        .send(fixture)
        .expect(403);
    });
  });

  describe('/v1/todos (GET)', () => {
    it('should able to get all todos', async () => {
      const todo = await prisma.todo.create({
        data: {
          name: 'test todo',
          description: 'desc',
          authorId: user.id,
          dueAt: new Date(future),
        },
      });

      return request(app.getHttpServer())
        .get('/v1/todos')
        .set('Authorization', `Bearer ${token}`)
        .expect(200)
        .expect((res) => {
          expect(res.body.data).toHaveLength(1);
          expect(res.body.data[0].id).toEqual(todo.uuid);
        });
    });

    it('should able to filter by status', async () => {
      await prisma.todo.createMany({
        data: [
          {
            name: 'not started',
            description: 'desc',
            authorId: user.id,
            status: 'NOT_STARTED',
            dueAt: new Date(future),
          },
          {
            name: 'in progress',
            description: 'desc',
            authorId: user.id,
            status: 'IN_PROGRESS',
            dueAt: new Date(future),
          },
          {
            name: 'completed',
            description: 'desc',
            authorId: user.id,
            status: 'COMPLETED',
            dueAt: new Date(future),
          },
        ],
      });

      await request(app.getHttpServer())
        .get('/v1/todos')
        .set('Authorization', `Bearer ${token}`)
        .query({
          'filter.status': '$in:NOT_STARTED,COMPLETED',
        })
        .expect(200)
        .expect((res) => {
          expect(res.body.data).toHaveLength(2);
          expect(res.body.data).toContainEqual(
            expect.objectContaining({
              attributes: expect.objectContaining({
                name: 'not started',
              }),
            }),
          );
          expect(res.body.data).toContainEqual(
            expect.objectContaining({
              attributes: expect.objectContaining({
                name: 'completed',
              }),
            }),
          );
        });

      await request(app.getHttpServer())
        .get('/v1/todos')
        .set('Authorization', `Bearer ${token}`)
        .query({
          'filter.status': '$eq:IN_PROGRESS',
        })
        .expect(200)
        .expect((res) => {
          expect(res.body.data).toHaveLength(1);
          expect(res.body.data).toContainEqual(
            expect.objectContaining({
              attributes: expect.objectContaining({
                name: 'in progress',
              }),
            }),
          );
        });
    });

    it('should able to filter by dueDate', async () => {
      await prisma.todo.createMany({
        data: [
          {
            name: 'not started',
            description: 'desc',
            authorId: user.id,
            dueAt: new Date(future - 1000),
          },
          {
            name: 'in progress',
            description: 'desc',
            authorId: user.id,
            status: 'IN_PROGRESS',
            dueAt: new Date(future + 1000),
          },
          {
            name: 'completed',
            description: 'desc',
            authorId: user.id,
            status: 'COMPLETED',
            dueAt: new Date(future),
          },
        ],
      });

      await request(app.getHttpServer())
        .get('/v1/todos')
        .set('Authorization', `Bearer ${token}`)
        .query({
          'filter.dueAt': `$gte:${new Date(future).toISOString()}`,
        })
        .expect(200)
        .expect((res) => {
          expect(res.body.data).toHaveLength(2);
          expect(res.body.data).toContainEqual(
            expect.objectContaining({
              attributes: expect.objectContaining({
                name: 'in progress',
              }),
            }),
          );
          expect(res.body.data).toContainEqual(
            expect.objectContaining({
              attributes: expect.objectContaining({
                name: 'completed',
              }),
            }),
          );
        });

      await request(app.getHttpServer())
        .get('/v1/todos')
        .set('Authorization', `Bearer ${token}`)
        .query({
          'filter.dueAt': `$btw:${new Date(
            future - 1000,
          ).toISOString()},${new Date(future).toISOString()}`,
        })
        .expect(200)
        .expect((res) => {
          expect(res.body.data).toHaveLength(2);
          expect(res.body.data).toContainEqual(
            expect.objectContaining({
              attributes: expect.objectContaining({
                name: 'completed',
              }),
            }),
          );
          expect(res.body.data).toContainEqual(
            expect.objectContaining({
              attributes: expect.objectContaining({
                name: 'not started',
              }),
            }),
          );
        });
    });
  });

  describe('/v1/todos/:uuid (GET)', () => {
    it('should able to get todo details', async () => {
      const todo = await prisma.todo.create({
        data: {
          name: 'test todo details',
          description: 'desc',
          authorId: user.id,
          dueAt: new Date(future),
        },
      });

      return request(app.getHttpServer())
        .get(`/v1/todos/${todo.uuid}`)
        .set('Authorization', `Bearer ${token}`)
        .expect(200)
        .expect((res) => {
          expect(res.body.data.attributes.name).toEqual(todo.name);
        });
    });
  });

  describe('/v1/todos/:uuid (PATCH)', () => {
    it('should update todo', async () => {
      const todo = await prisma.todo.create({
        data: {
          name: 'test todo',
          description: 'desc',
          authorId: user.id,
          dueAt: new Date(future),
        },
      });

      await request(app.getHttpServer())
        .patch(`/v1/todos/${todo.uuid}`)
        .set('Authorization', `Bearer ${token}`)
        .send({
          name: 'yolo',
        })
        .expect(200)
        .expect((res) => {
          expect(res.body.data.attributes.name).toEqual('yolo');
        });

      const activity = prisma.activity.findFirst({
        where: { actorId: user.id, model: 'Todo', action: 'UPDATE' },
      });
      expect(activity).not.toBeNull();
    });

    it('should not let normal user to update other users todo', async () => {
      const todo = await prisma.todo.create({
        data: {
          name: 'test todo',
          description: 'desc',
          authorId: adminUser.id,
          dueAt: new Date(future),
        },
      });

      return request(app.getHttpServer())
        .patch(`/v1/todos/${todo.uuid}`)
        .set('Authorization', `Bearer ${token}`)
        .send({
          name: 'yolo',
        })
        .expect(404);
    });

    it('should throw 403 for ro user', async () => {
      return await request(app.getHttpServer())
        .patch(`/v1/todos/${randomUUID()}`)
        .set('Authorization', `Bearer ${roToken}`)
        .send({
          name: 'yolo',
        })
        .expect(403);
    });
  });

  describe('/v1/todos/:uuid (DELETE)', () => {
    it('should delete todo', async () => {
      const todo = await prisma.todo.create({
        data: {
          name: 'test todo',
          description: 'desc',
          authorId: user.id,
          dueAt: new Date(future),
        },
      });

      await request(app.getHttpServer())
        .delete(`/v1/todos/${todo.uuid}`)
        .set('Authorization', `Bearer ${token}`)
        .expect(200);

      await expect(
        prisma.todo.findFirst({ where: { id: todo.id } }),
      ).resolves.toBeNull();

      const activity = prisma.activity.findFirst({
        where: { actorId: user.id, model: 'Todo', action: 'DELETE' },
      });
      expect(activity).not.toBeNull();
    });

    it('should not let normal user to delete other users todo', async () => {
      const todo = await prisma.todo.create({
        data: {
          name: 'test todo',
          description: 'desc',
          authorId: adminUser.id,
          dueAt: new Date(future),
        },
      });

      await request(app.getHttpServer())
        .delete(`/v1/todos/${todo.uuid}`)
        .set('Authorization', `Bearer ${token}`)
        .expect(404);

      await expect(
        prisma.todo.findFirst({ where: { id: todo.id } }),
      ).resolves.not.toBeNull();
    });

    it('should let admin user to delete other users todo', async () => {
      const todo = await prisma.todo.create({
        data: {
          name: 'test todo',
          description: 'desc',
          authorId: user.id,
          dueAt: new Date(future),
        },
      });

      await request(app.getHttpServer())
        .delete(`/v1/todos/${todo.uuid}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      await expect(
        prisma.todo.findFirst({ where: { id: todo.id } }),
      ).resolves.toBeNull();
    });

    it('should throw 403 for ro user', async () => {
      return await request(app.getHttpServer())
        .delete(`/v1/todos/${randomUUID()}`)
        .set('Authorization', `Bearer ${roToken}`)
        .expect(403);
    });
  });
});
