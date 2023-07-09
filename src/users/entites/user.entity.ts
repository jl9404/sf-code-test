import { ApiProperty } from '@nestjs/swagger';
import { Role, User } from '@prisma/client';
import { Exclude, Transform, Type } from 'class-transformer';
import { IsEmail } from 'class-validator';
import { BaseEntity } from 'src/common/prisma/base.entity';

export class UserEntity extends BaseEntity<User> implements User {
  @Exclude({ toPlainOnly: true })
  @Type(() => BigInt)
  @Transform(({ value }) => BigInt(value))
  id: bigint;

  @ApiProperty()
  uuid: string;

  @IsEmail()
  @ApiProperty()
  email: string;

  @Exclude()
  password: string;

  @Exclude({ toPlainOnly: true })
  roles: Role[];

  @Type(() => Date)
  createdAt: Date;

  @Type(() => Date)
  updatedAt: Date;
}
