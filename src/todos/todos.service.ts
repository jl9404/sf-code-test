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

@Injectable()
export class TodosService {
  private readonly logger = new Logger(TodosService.name);

  constructor(
    @InjectPrisma()
    private readonly prisma: ExtendedPrismaClient,
    @InjectReadOnlyPrisma()
    private readonly readOnlyPrisma: ExtendedPrismaClient,
  ) {}

  async create(createTodoDto: CreateTodoDto) {
    return new TodoEntity(
      await this.prisma.todo.create({ data: createTodoDto }),
    );
  }

  async findAll(params?: ParsedQuery<Todo>) {
    const transformer = new ParsedQueryTransformer<Todo>({
      ...todoParsingConfig,
      useHas: ['tags'],
    });

    const todos = await this.readOnlyPrisma.todo.findMany(
      transformer.transform(params),
    );

    return todos.map((todo) => new TodoEntity(todo));
  }

  async count(params?: ParsedQuery<Todo>) {
    const transformer = new ParsedQueryTransformer<Todo>({
      ...todoParsingConfig,
      useHas: ['tags'],
    });

    const args = transformer.transform(params);

    delete args.skip;
    delete args.take;
    delete args.orderBy;

    return await this.readOnlyPrisma.todo.count(args);
  }

  async findAllAndCount(params: ParsedQuery<Todo>) {
    const total = await this.count(params);

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
      todos: await this.findAll(params),
      pagination,
    };
  }

  async findOne(uuid: string) {
    return new TodoEntity(
      await this.readOnlyPrisma.todo.findUniqueOrThrow({ where: { uuid } }),
    );
  }

  async update(uuid: string, updateTodoDto: UpdateTodoDto) {
    return new TodoEntity(
      await this.prisma.todo.update({
        where: { uuid },
        data: updateTodoDto,
      }),
    );
  }

  async remove(uuid: string) {
    await this.prisma.todo.delete({ where: { uuid } });
  }
}
