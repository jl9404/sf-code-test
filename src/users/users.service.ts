import { Injectable } from '@nestjs/common';
import {
  InjectPrisma,
  InjectReadOnlyPrisma,
} from 'src/common/prisma/prisma.decorator';
import { ExtendedPrismaClient } from 'src/common/prisma/prisma.extension';
import { CreateUserDto } from './dto/create-user.dto';
import * as argon2 from 'argon2';

@Injectable()
export class UsersService {
  constructor(
    @InjectPrisma()
    private readonly prisma: ExtendedPrismaClient,
    @InjectReadOnlyPrisma()
    private readonly readOnlyPrisma: ExtendedPrismaClient,
  ) {}

  async create(createUserDto: CreateUserDto) {
    return await this.prisma.user.create({
      data: {
        ...createUserDto,
        password: await argon2.hash(createUserDto.password),
      },
    });
  }

  async findOne(uuid: string) {
    return await this.readOnlyPrisma.user.findUniqueOrThrow({
      where: { uuid },
    });
  }

  async findOneByEmail(email: string) {
    return await this.readOnlyPrisma.user.findUnique({
      where: { email },
    });
  }
}
