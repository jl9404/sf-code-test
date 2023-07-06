import { CreateTodoDto } from './create-todo.dto';
import { Status } from '@prisma/client';
import { IsEnum, ValidateIf } from 'class-validator';
import { ApiPropertyOptional, PartialType } from '@nestjs/swagger';

export class UpdateTodoDto extends PartialType(CreateTodoDto) {
  @IsEnum(Status)
  @ValidateIf((dto) => Boolean(dto.status))
  @ApiPropertyOptional({ enum: Status })
  status?: Status;
}
