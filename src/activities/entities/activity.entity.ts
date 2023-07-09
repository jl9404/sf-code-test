import { ResourceId } from '@luxury-presence/nestjs-jsonapi';
import { ApiProperty } from '@nestjs/swagger';
import { Action, Activity, Model, Prisma, User } from '@prisma/client';
import { Exclude } from 'class-transformer';
import { BaseEntity } from 'src/common/prisma/base.entity';
import { UserEntity } from 'src/users/entites/user.entity';

export class ActivityEntity extends BaseEntity<Activity> implements Activity {
  @Exclude()
  id: bigint;

  @ResourceId()
  @ApiProperty()
  uuid: string;

  @Exclude()
  actorId: bigint;

  @ApiProperty()
  actor: UserEntity;

  @ApiProperty()
  model: Model;

  @ApiProperty()
  action: Action;

  @Exclude()
  beforePayload: Prisma.JsonValue;

  @Exclude()
  afterPayload: Prisma.JsonValue;

  @ApiProperty()
  createdAt: Date;

  @ApiProperty()
  updatedAt: Date | null;

  constructor(partial: Partial<Activity>, actor?: User) {
    super(partial);

    if (actor) {
      this.actor = new UserEntity(actor);
    }
  }
}
