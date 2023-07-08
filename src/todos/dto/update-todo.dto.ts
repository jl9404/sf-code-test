import { CreateTodoDto } from './create-todo.dto';
import { Priority, Status } from '@prisma/client';
import { IsEnum, IsOptional } from 'class-validator';
import { ApiPropertyOptional, OmitType, PartialType } from '@nestjs/swagger';

export class UpdateTodoDto extends PartialType(
  OmitType(CreateTodoDto, ['priority']),
) {
  @IsEnum(Priority)
  @IsOptional()
  @ApiPropertyOptional({ enum: Priority })
  priority?: Priority;

  @IsEnum(Status)
  @IsOptional()
  @ApiPropertyOptional({ enum: Status })
  status?: Status;
}
