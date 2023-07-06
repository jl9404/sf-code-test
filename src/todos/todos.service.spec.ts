import { TestBed } from '@automock/jest';
import { TodosService } from './todos.service';
import { ExtendedPrismaClient } from 'src/common/prisma/prisma.extension';
import {
  PRISMA_MASTER_CONNECTION,
  PRISMA_READ_CONNECTION,
} from 'src/common/prisma/constants';
import { randomUUID } from 'crypto';
import { Prisma } from '.prisma/client';

describe('TodosService', () => {
  let service: TodosService;
  let prisma: jest.Mocked<ExtendedPrismaClient>;
  let prismaReadOnly: jest.Mocked<ExtendedPrismaClient>;

  const fixture = [
    {
      uuid: randomUUID(),
      name: 'hello',
      description: 'description',
      dueAt: new Date(),
    },
    {
      uuid: randomUUID(),
      name: 'hello2',
      description: 'description',
      dueAt: new Date(),
    },
  ];

  beforeAll(() => {
    const { unit, unitRef } = TestBed.create(TodosService).compile();

    service = unit;
    prisma = unitRef.get(PRISMA_MASTER_CONNECTION);
    prismaReadOnly = unitRef.get(PRISMA_READ_CONNECTION);
  });

  describe('create', () => {
    it('should create new todo', async () => {
      prisma.todo.create = jest.fn().mockResolvedValue(fixture[0]);

      const todo = await service.create(fixture[0]);

      expect(prisma.todo.create).toHaveBeenCalled();
      expect(todo.name).toEqual(fixture[0].name);
    });
  });

  describe('findAll', () => {
    it('should find all todos', async () => {
      prismaReadOnly.todo.findMany = jest.fn().mockResolvedValue(fixture);

      const todos = await service.findAll();

      expect(prismaReadOnly.todo.findMany).toHaveBeenCalled();
      expect(todos[0].name).toEqual(fixture[0].name);
      expect(todos[1].name).toEqual(fixture[1].name);
    });
  });

  describe('findOne', () => {
    it('should find todo by uuid', async () => {
      prismaReadOnly.todo.findUniqueOrThrow = jest
        .fn()
        .mockResolvedValue(fixture[0]);

      const todo = await service.findOne(fixture[0].uuid);

      expect(prismaReadOnly.todo.findUniqueOrThrow).toHaveBeenCalled();
      expect(todo.name).toEqual(fixture[0].name);
    });

    it('should throw error if todo is not existed', async () => {
      prismaReadOnly.todo.findUniqueOrThrow = jest
        .fn()
        .mockRejectedValue(new Prisma.NotFoundError('No Todo found'));

      await expect(service.findOne(randomUUID())).rejects.toThrow();
      expect(prismaReadOnly.todo.findUniqueOrThrow).toHaveBeenCalled();
    });
  });

  describe('update', () => {
    it('should update todo', async () => {
      prisma.todo.update = jest.fn().mockResolvedValue({
        ...fixture[0],
        name: 'updated',
      });

      const todo = await service.update(fixture[0].uuid, { name: 'updated' });

      expect(prisma.todo.update).toHaveBeenCalled();
      expect(todo.name).toEqual('updated');
    });
  });

  describe('remove', () => {
    it('should remove todo', async () => {
      prisma.todo.delete = jest.fn().mockResolvedValue({});

      await service.remove(fixture[0].uuid);

      expect(prisma.todo.delete).toHaveBeenCalled();
    });
  });
});
