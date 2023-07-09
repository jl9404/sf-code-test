import { Controller, Get, Inject } from '@nestjs/common';
import {
  HealthCheck,
  HealthCheckService,
  PrismaHealthIndicator,
} from '@nestjs/terminus';
import { Public } from './auth/decorators/public.decorator';
import {
  InjectPrisma,
  InjectReadOnlyPrisma,
} from './common/prisma/prisma.decorator';
import { ExtendedPrismaClient } from './common/prisma/prisma.extension';
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import { RedisCache } from 'cache-manager-ioredis-yet';

@Controller()
export class AppController {
  constructor(
    private readonly healthCheckService: HealthCheckService,
    private readonly prismaHealthIndicator: PrismaHealthIndicator,
    @InjectPrisma()
    private readonly prisma: ExtendedPrismaClient,
    @InjectReadOnlyPrisma()
    private readonly readOnlyPrisma: ExtendedPrismaClient,
    @Inject(CACHE_MANAGER)
    private readonly cache: RedisCache,
  ) {}

  @Public()
  @Get('/health')
  @HealthCheck()
  health() {
    return this.healthCheckService.check([
      () => this.prismaHealthIndicator.pingCheck('masterDb', this.prisma),
      () =>
        this.prismaHealthIndicator.pingCheck('readOnlyDb', this.readOnlyPrisma),
      async () => {
        return {
          redis: {
            status: this.cache.store.client.status === 'ready' ? 'up' : 'down',
          },
        };
      },
    ]);
  }
}
