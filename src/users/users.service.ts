import { Injectable } from '@nestjs/common';
import {
  InjectPrisma,
  InjectReadOnlyPrisma,
} from 'src/common/prisma/prisma.decorator';
import { ExtendedPrismaClient } from 'src/common/prisma/prisma.extension';
import { CreateUserDto } from './dto/create-user.dto';
import * as argon2 from 'argon2';
import { DeltaChangedEvent } from 'src/activities/events/delta-changed.event';
import { EventEmitter2 } from '@nestjs/event-emitter';

@Injectable()
export class UsersService {
  constructor(
    @InjectPrisma()
    private readonly prisma: ExtendedPrismaClient,
    @InjectReadOnlyPrisma()
    private readonly readOnlyPrisma: ExtendedPrismaClient,
    private readonly eventEmitter: EventEmitter2,
  ) {}

  async create(createUserDto: CreateUserDto) {
    const user = await this.prisma.user.create({
      data: {
        ...createUserDto,
        password: await argon2.hash(createUserDto.password),
      },
    });

    this.eventEmitter.emit(
      'delta.changed',
      new DeltaChangedEvent({
        actorId: user.id,
        model: 'User',
        action: 'CREATE',
        afterPayload: {
          uuid: user.uuid,
        },
      }),
    );

    return user;
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
