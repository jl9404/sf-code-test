import { ApiProperty } from '@nestjs/swagger';
import { Todo, Status } from '@prisma/client';
import { Exclude } from 'class-transformer';
import { BaseEntity } from 'src/common/prisma/base.entity';

export class TodoEntity extends BaseEntity<Todo> implements Todo {
  @Exclude()
  id: bigint;

  @ApiProperty()
  uuid: string;

  @ApiProperty()
  name: string;

  @ApiProperty()
  description: string;

  @ApiProperty({ enum: Status })
  status: Status;

  @ApiProperty()
  dueAt: Date;

  @ApiProperty()
  createdAt: Date;

  @ApiProperty()
  updatedAt: Date;
}
