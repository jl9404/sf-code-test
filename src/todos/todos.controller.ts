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
import { ApiCreatedResponse, ApiOkResponse, ApiTags } from '@nestjs/swagger';
import { TodoEntity } from './entities/todo.entity';

@Controller({
  path: 'todos',
  version: '1',
})
@ApiTags('todos')
export class TodosController {
  constructor(private readonly todosService: TodosService) {}

  @Post()
  @ApiCreatedResponse({ type: TodoEntity })
  create(@Body() createTodoDto: CreateTodoDto) {
    return this.todosService.create(createTodoDto);
  }

  @Get()
  @ApiOkResponse({ type: TodoEntity, isArray: true })
  findAll() {
    return this.todosService.findAll();
  }

  @Get(':uuid')
  @ApiOkResponse({ type: TodoEntity })
  findOne(@Param('uuid', ParseUUIDPipe) uuid: string) {
    return this.todosService.findOne(uuid);
  }

  @Patch(':uuid')
  @ApiOkResponse({ type: TodoEntity })
  update(
    @Param('uuid', ParseUUIDPipe) uuid: string,
    @Body() updateTodoDto: UpdateTodoDto,
  ) {
    return this.todosService.update(uuid, updateTodoDto);
  }

  @Delete(':uuid')
  @ApiOkResponse()
  async remove(@Param('uuid', ParseUUIDPipe) uuid: string) {
    await this.todosService.remove(uuid);

    return {};
  }
}
