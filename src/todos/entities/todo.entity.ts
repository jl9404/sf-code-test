import { ResourceId } from '@luxury-presence/nestjs-jsonapi';
import { ApiProperty } from '@nestjs/swagger';
import { Todo, Status, Priority } from '@prisma/client';
import { Exclude } from 'class-transformer';
import { BaseEntity } from 'src/common/prisma/base.entity';

export class TodoEntity extends BaseEntity<Todo> implements Todo {
  @Exclude()
  id: bigint;

  @Exclude()
  authorId: bigint;

  @ApiProperty()
  @ResourceId()
  uuid: string;

  @ApiProperty()
  name: string;

  @ApiProperty()
  description: string;

  @ApiProperty({ enum: Status })
  status: Status;

  @ApiProperty({ enum: Priority })
  priority: Priority;

  @ApiProperty({ type: 'string', isArray: true })
  tags: string[];

  @ApiProperty()
  dueAt: Date;

  @ApiProperty()
  createdAt: Date;

  @ApiProperty()
  updatedAt: Date;
}
