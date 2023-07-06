import { Injectable } from '@nestjs/common';
import { CreateTodoDto } from './dto/create-todo.dto';
import { UpdateTodoDto } from './dto/update-todo.dto';
import {
  InjectPrisma,
  InjectReadOnlyPrisma,
} from 'src/common/prisma/prisma.decorator';
import { TodoEntity } from './entities/todo.entity';
import { ExtendedPrismaClient } from 'src/common/prisma/prisma.extension';

@Injectable()
export class TodosService {
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

  async findAll() {
    const todos = await this.readOnlyPrisma.todo.findMany();
    return todos.map((todo) => new TodoEntity(todo));
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
