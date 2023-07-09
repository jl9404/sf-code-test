import { Injectable } from '@nestjs/common';
import { OnEvent } from '@nestjs/event-emitter';
import { DeltaChangedEvent } from '../events/delta-changed.event';
import { InjectPrisma } from 'src/common/prisma/prisma.decorator';
import { ExtendedPrismaClient } from 'src/common/prisma/prisma.extension';

@Injectable()
export class DeltaChangedListener {
  constructor(
    @InjectPrisma()
    private readonly prisma: ExtendedPrismaClient,
  ) {}

  @OnEvent('delta.changed', { async: true })
  async handleDeltaChangedEvent(event: DeltaChangedEvent) {
    await this.prisma.activity.create({
      data: event,
    });
  }
}
