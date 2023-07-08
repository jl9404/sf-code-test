import { Injectable, Logger } from '@nestjs/common';
import { CreateTodoDto } from './dto/create-todo.dto';
import { UpdateTodoDto } from './dto/update-todo.dto';
import {
  InjectPrisma,
  InjectReadOnlyPrisma,
} from 'src/common/prisma/prisma.decorator';
import { TodoEntity } from './entities/todo.entity';
import { ExtendedPrismaClient } from 'src/common/prisma/prisma.extension';
import { Todo } from '@prisma/client';
import { ParsedQuery } from '@luxury-presence/nestjs-jsonapi';
import { todoParsingConfig } from './constants';
import { ParsedQueryTransformer } from 'src/common/parsed-query.transformer';
import { DEFAULT_PAGE_LIMIT } from 'src/common/constants';
import { UserEntity } from 'src/users/entites/user.entity';
import { CaslAbilityFactory } from 'src/auth/casl-ability.factory';
import { accessibleBy } from '@casl/prisma';
import { Action } from 'src/auth/constants';

@Injectable()
export class TodosService {
  private readonly logger = new Logger(TodosService.name);

  constructor(
    @InjectPrisma()
    private readonly prisma: ExtendedPrismaClient,
    @InjectReadOnlyPrisma()
    private readonly readOnlyPrisma: ExtendedPrismaClient,
    private readonly caslAbilityFactory: CaslAbilityFactory,
  ) {}

  async create(user: UserEntity, createTodoDto: CreateTodoDto) {
    return new TodoEntity(
      await this.prisma.todo.create({
        data: {
          ...createTodoDto,
          authorId: user.id,
        },
      }),
    );
  }

  async findAll(user: UserEntity, params?: ParsedQuery<Todo>) {
    const ability = this.caslAbilityFactory.createForUser(user);

    const transformer = new ParsedQueryTransformer<Todo>({
      ...todoParsingConfig,
      useHas: ['tags'],
    });

    const args = transformer.transform(params);

    const todos = await this.readOnlyPrisma.todo.findMany({
      ...args,
      where: {
        AND: [accessibleBy(ability, Action.Read).Todo, args.where || {}],
      },
    });

    return todos.map((todo) => new TodoEntity(todo));
  }

  async count(user: UserEntity, params?: ParsedQuery<Todo>) {
    const ability = this.caslAbilityFactory.createForUser(user);

    const transformer = new ParsedQueryTransformer<Todo>({
      ...todoParsingConfig,
      useHas: ['tags'],
    });

    const args = transformer.transform(params);

    return await this.readOnlyPrisma.todo.count({
      where: {
        AND: [accessibleBy(ability, Action.Read).Todo, args.where || {}],
      },
    });
  }

  async findAllAndCount(user: UserEntity, params: ParsedQuery<Todo>) {
    const total = await this.count(user, params);

    const pagination = {
      page: params.page?.on || 1,
      pageSize: params.page?.limit || DEFAULT_PAGE_LIMIT,
      pageCount: Math.ceil(total / (params.page?.limit || DEFAULT_PAGE_LIMIT)),
      total,
    };

    if (total === 0 || pagination.page > pagination.pageCount) {
      this.logger.log(
        '[findAllAndCount] Invalid current page, skipping fetch todos',
      );

      return { todos: [], pagination };
    }

    return {
      todos: await this.findAll(user, params),
      pagination,
    };
  }

  async findOne(user: UserEntity, uuid: string) {
    const ability = this.caslAbilityFactory.createForUser(user);

    return new TodoEntity(
      await this.readOnlyPrisma.todo.findFirstOrThrow({
        where: {
          AND: [accessibleBy(ability, Action.Read).Todo, { uuid }],
        },
      }),
    );
  }

  async update(user: UserEntity, uuid: string, updateTodoDto: UpdateTodoDto) {
    const ability = this.caslAbilityFactory.createForUser(user);

    const todo = await this.prisma.todo.update({
      where: {
        uuid,
        AND: [accessibleBy(ability, Action.Update).Todo],
      },
      data: updateTodoDto,
    });

    return new TodoEntity(todo);
  }

  async remove(user: UserEntity, uuid: string) {
    const ability = this.caslAbilityFactory.createForUser(user);

    await this.prisma.todo.delete({
      where: {
        uuid,
        AND: [accessibleBy(ability, Action.Delete).Todo],
      },
    });
  }
}
