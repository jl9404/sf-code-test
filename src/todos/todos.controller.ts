import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  ParseUUIDPipe,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { TodosService } from './todos.service';
import { CreateTodoDto } from './dto/create-todo.dto';
import { UpdateTodoDto } from './dto/update-todo.dto';
import {
  ApiBearerAuth,
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
import { CurrentUser } from 'src/auth/decorators/current-user.decorator';
import { UserEntity } from 'src/users/entites/user.entity';
import { PoliciesGuard } from 'src/auth/policies.guard';
import { Action } from 'src/auth/constants';
import { CheckPolicies } from 'src/auth/decorators/check-policies.decorator';
import { HttpCacheInterceptor } from 'src/common/interceptors/http-cache.interceptor';
import { CacheResource } from 'src/auth/decorators/cache-resource.decorator';

@Controller({
  path: 'todos',
  version: '1',
})
@ApiTags('todos')
@ApiExtraModels(TodoEntity)
@UseInterceptors(HttpCacheInterceptor)
@CacheResource(TodoEntity)
export class TodosController {
  constructor(private readonly todosService: TodosService) {}

  @Post()
  @ApiBearerAuth('auth')
  @ApiCreatedResponse({
    schema: successResponseSchema(TodoEntity),
  })
  @UseGuards(PoliciesGuard)
  @CheckPolicies((ability) => ability.can(Action.Create, 'Todo'))
  async create(
    @CurrentUser() user: UserEntity,
    @Body() createTodoDto: CreateTodoDto,
  ) {
    return SuccessResponse.of(
      await this.todosService.create(user, createTodoDto),
    );
  }

  @Get()
  @ApiBearerAuth('auth')
  @ApiOkResponse({
    schema: successResponseSchema([TodoEntity]),
  })
  @ApiFilterQuery(todoParsingConfig)
  @UseGuards(PoliciesGuard)
  @CheckPolicies((ability) => ability.can(Action.Read, 'Todo'))
  async findAll(
    @CurrentUser() user: UserEntity,
    // TODO: change it to PipeTransform?
    @ParseJsonApiQuery<Todo>({
      config: todoParsingConfig,
    })
    params: ParsedQuery<Todo>,
  ) {
    const { todos, pagination } = await this.todosService.findAllAndCount(
      user,
      params,
    );

    return SuccessResponse.of(todos, { pagination });
  }

  @Get(':uuid')
  @ApiBearerAuth('auth')
  @ApiOkResponse({ schema: successResponseSchema(TodoEntity) })
  @UseGuards(PoliciesGuard)
  @CheckPolicies((ability) => ability.can(Action.Read, 'Todo'))
  async findOne(
    @CurrentUser() user: UserEntity,
    @Param('uuid', ParseUUIDPipe) uuid: string,
  ) {
    return SuccessResponse.of(await this.todosService.findOne(user, uuid));
  }

  @Patch(':uuid')
  @ApiBearerAuth('auth')
  @ApiOkResponse({ schema: successResponseSchema(TodoEntity) })
  @UseGuards(PoliciesGuard)
  @CheckPolicies((ability) => ability.can(Action.Update, 'Todo'))
  async update(
    @CurrentUser() user: UserEntity,
    @Param('uuid', ParseUUIDPipe) uuid: string,
    @Body() updateTodoDto: UpdateTodoDto,
  ) {
    return SuccessResponse.of(
      await this.todosService.update(user, uuid, updateTodoDto),
    );
  }

  @Delete(':uuid')
  @ApiBearerAuth('auth')
  @ApiOkResponse()
  @UseGuards(PoliciesGuard)
  @CheckPolicies((ability) => ability.can(Action.Delete, 'Todo'))
  async remove(
    @CurrentUser() user: UserEntity,
    @Param('uuid', ParseUUIDPipe) uuid: string,
  ) {
    await this.todosService.remove(user, uuid);

    return {};
  }
}
