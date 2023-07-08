import { User } from '@prisma/client';
import { Exclude } from 'class-transformer';
import { IsEmail } from 'class-validator';
import { BaseEntity } from 'src/common/prisma/base.entity';

export class UserEntity extends BaseEntity<User> implements User {
  @Exclude()
  id: bigint;

  uuid: string;

  @IsEmail()
  email: string;

  @Exclude()
  password: string;

  createdAt: Date;

  updatedAt: Date;
}
