import { TestBed } from '@automock/jest';
import { TodosService } from './todos.service';
import { ExtendedPrismaClient } from 'src/common/prisma/prisma.extension';
import {
  PRISMA_MASTER_CONNECTION,
  PRISMA_READ_CONNECTION,
} from 'src/common/prisma/constants';
import { randomUUID } from 'crypto';
import { Prisma } from '.prisma/client';
import { Role } from '@prisma/client';
import { UserEntity } from 'src/users/entites/user.entity';
import { CaslAbilityFactory } from 'src/auth/casl-ability.factory';

describe('TodosService', () => {
  let service: TodosService;
  let prisma: jest.Mocked<ExtendedPrismaClient>;
  let prismaReadOnly: jest.Mocked<ExtendedPrismaClient>;

  const user = {
    id: 1,
    roles: [Role.ADMIN],
  } as unknown as UserEntity;

  const fixture = [
    {
      uuid: randomUUID(),
      name: 'hello',
      description: 'description',
      dueAt: new Date(),
      authorId: 1,
    },
    {
      uuid: randomUUID(),
      name: 'hello2',
      description: 'description',
      dueAt: new Date(),
      authorId: 1,
    },
  ];

  beforeAll(() => {
    const { unit, unitRef } = TestBed.create(TodosService)
      .mock(CaslAbilityFactory)
      .using(new CaslAbilityFactory())
      .compile();

    service = unit;
    prisma = unitRef.get(PRISMA_MASTER_CONNECTION);
    prismaReadOnly = unitRef.get(PRISMA_READ_CONNECTION);
  });

  describe('create', () => {
    it('should create new todo', async () => {
      prisma.todo.create = jest.fn().mockResolvedValue(fixture[0]);

      const todo = await service.create(user, fixture[0]);

      expect(prisma.todo.create).toHaveBeenCalled();
      expect(todo.name).toEqual(fixture[0].name);
    });
  });

  describe('findAll', () => {
    it('should find all todos', async () => {
      prismaReadOnly.todo.findMany = jest.fn().mockResolvedValue(fixture);

      const todos = await service.findAll(user);

      expect(prismaReadOnly.todo.findMany).toHaveBeenCalled();
      expect(todos[0].name).toEqual(fixture[0].name);
      expect(todos[1].name).toEqual(fixture[1].name);
    });

    it('should find with default filter', async () => {
      prismaReadOnly.todo.findMany = jest.fn().mockResolvedValue(fixture);

      await service.findAll(user, {});

      expect(prismaReadOnly.todo.findMany).toHaveBeenCalledWith({
        skip: 0,
        take: 10,
        where: { AND: [{}, {}] },
      });
    });

    it('should handle filtering & sorting', async () => {
      prismaReadOnly.todo.findMany = jest.fn().mockResolvedValue(fixture);

      await service.findAll(user, {
        filter: {
          name: {
            $eq: 'todo',
          },
          status: {
            $in: ['NOT_STARTED', 'IN_PROGRESS'],
          },
          tags: {
            $eq: 'tag1',
          },
        },
        sort: [['createdAt', 'DESC']],
      });

      expect(prismaReadOnly.todo.findMany).toHaveBeenCalledWith({
        skip: 0,
        take: 10,
        where: {
          AND: [
            {},
            {
              name: {
                equals: 'todo',
              },
              status: {
                in: ['NOT_STARTED', 'IN_PROGRESS'],
              },
              tags: {
                has: 'tag1',
              },
            },
          ],
        },
        orderBy: [
          {
            createdAt: 'desc',
          },
        ],
      });
    });
  });

  describe('count', () => {
    it('should count without params', async () => {
      prismaReadOnly.todo.count = jest.fn().mockResolvedValue(1);

      const count = await service.count(user);

      expect(prismaReadOnly.todo.count).toHaveBeenCalled();
      expect(count).toBe(1);
    });

    it('should count with filter', async () => {
      prismaReadOnly.todo.count = jest.fn().mockResolvedValue(1);

      const count = await service.count(user, {
        page: {
          on: 2,
          limit: 1,
        },
        sort: [['createdAt', 'DESC']],
        filter: {
          name: {
            $eq: 'todo',
          },
          tags: {
            $in: ['tag1', 'tag2'],
          },
        },
      });

      expect(prismaReadOnly.todo.count).toHaveBeenCalledWith({
        where: {
          AND: [
            {},
            {
              name: {
                equals: 'todo',
              },
              tags: {
                hasEvery: ['tag1', 'tag2'],
              },
            },
          ],
        },
      });
      expect(count).toBe(1);
    });
  });

  describe('findOne', () => {
    it('should find todo by uuid', async () => {
      prismaReadOnly.todo.findFirstOrThrow = jest
        .fn()
        .mockResolvedValue(fixture[0]);

      const todo = await service.findOne(user, fixture[0].uuid);

      expect(prismaReadOnly.todo.findFirstOrThrow).toHaveBeenCalled();
      expect(todo.name).toEqual(fixture[0].name);
    });

    it('should throw error if todo is not existed', async () => {
      prismaReadOnly.todo.findFirstOrThrow = jest
        .fn()
        .mockRejectedValue(new Prisma.NotFoundError('No Todo found'));

      await expect(service.findOne(user, randomUUID())).rejects.toThrow();
      expect(prismaReadOnly.todo.findFirstOrThrow).toHaveBeenCalled();
    });
  });

  describe('update', () => {
    it('should update todo', async () => {
      prisma.todo.update = jest.fn().mockResolvedValue({
        ...fixture[0],
        name: 'updated',
      });

      const todo = await service.update(user, fixture[0].uuid, {
        name: 'updated',
      });

      expect(prisma.todo.update).toHaveBeenCalled();
      expect(todo.name).toEqual('updated');
    });
  });

  describe('remove', () => {
    it('should remove todo', async () => {
      prisma.todo.delete = jest.fn().mockResolvedValue({});

      await service.remove(user, fixture[0].uuid);

      expect(prisma.todo.delete).toHaveBeenCalled();
    });
  });
});
