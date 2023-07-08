import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  ParseUUIDPipe,
} from '@nestjs/common';
import { TodosService } from './todos.service';
import { CreateTodoDto } from './dto/create-todo.dto';
import { UpdateTodoDto } from './dto/update-todo.dto';
import {
  ApiCreatedResponse,
  ApiExtraModels,
  ApiOkResponse,
  ApiTags,
} from '@nestjs/swagger';
import { TodoEntity } from './entities/todo.entity';
import { Todo } from '@prisma/client';
import {
  ParseJsonApiQuery,
  ParsedQuery,
  SuccessResponse,
  successResponseSchema,
} from '@luxury-presence/nestjs-jsonapi';
import { ApiFilterQuery } from 'src/common/decorators/api-filter-query.decorator';
import { todoParsingConfig } from './constants';

@Controller({
  path: 'todos',
  version: '1',
})
@ApiTags('todos')
@ApiExtraModels(TodoEntity)
export class TodosController {
  constructor(private readonly todosService: TodosService) {}

  @Post()
  @ApiCreatedResponse({
    schema: successResponseSchema(TodoEntity),
  })
  async create(@Body() createTodoDto: CreateTodoDto) {
    return SuccessResponse.of(await this.todosService.create(createTodoDto));
  }

  @Get()
  @ApiOkResponse({
    schema: successResponseSchema([TodoEntity]),
  })
  @ApiFilterQuery(todoParsingConfig)
  async findAll(
    // TODO: change it to PipeTransform?
    @ParseJsonApiQuery<Todo>({
      config: todoParsingConfig,
    })
    params: ParsedQuery<Todo>,
  ) {
    const { todos, pagination } = await this.todosService.findAllAndCount(
      params,
    );

    return SuccessResponse.of(todos, { pagination });
  }

  @Get(':uuid')
  @ApiOkResponse({ schema: successResponseSchema(TodoEntity) })
  async findOne(@Param('uuid', ParseUUIDPipe) uuid: string) {
    return SuccessResponse.of(await this.todosService.findOne(uuid));
  }

  @Patch(':uuid')
  @ApiOkResponse({ schema: successResponseSchema(TodoEntity) })
  async update(
    @Param('uuid', ParseUUIDPipe) uuid: string,
    @Body() updateTodoDto: UpdateTodoDto,
  ) {
    return SuccessResponse.of(
      await this.todosService.update(uuid, updateTodoDto),
    );
  }

  @Delete(':uuid')
  @ApiOkResponse()
  async remove(@Param('uuid', ParseUUIDPipe) uuid: string) {
    await this.todosService.remove(uuid);

    return {};
  }
}
