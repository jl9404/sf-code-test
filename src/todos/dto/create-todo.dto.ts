import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Priority } from '@prisma/client';
import { Type } from 'class-transformer';
import {
  IsDate,
  IsEnum,
  IsNotEmpty,
  IsOptional,
  IsString,
  MinDate,
} from 'class-validator';

export class CreateTodoDto {
  @IsString()
  @IsNotEmpty()
  @ApiProperty()
  name: string;

  @IsString()
  @IsNotEmpty()
  @ApiProperty()
  description: string;

  @IsString({ each: true })
  @IsOptional()
  @ApiPropertyOptional({ type: 'string', isArray: true })
  tags?: string[];

  @IsEnum(Priority)
  @IsOptional()
  @ApiPropertyOptional({ enum: Priority })
  priority?: Priority = Priority.P2;

  @MinDate(() => new Date())
  @IsDate()
  @IsNotEmpty()
  @Type(() => Date)
  @ApiProperty()
  dueAt: Date;
}
