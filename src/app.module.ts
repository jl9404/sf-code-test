import { Inject, Logger, Module, OnModuleDestroy } from '@nestjs/common';
import { AppController } from './app.controller';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { PrismaModule } from './common/prisma/prisma.module';
import { TodosModule } from './todos/todos.module';
import { LoggerModule } from 'nestjs-pino';
import { isProd } from './common/constants';
import { AuthModule } from './auth/auth.module';
import { UsersModule } from './users/users.module';
import { APP_GUARD } from '@nestjs/core';
import { JwtAuthGuard } from './auth/jwt-auth.guard';
import { CACHE_MANAGER, CacheModule } from '@nestjs/cache-manager';
import { RedisCache, redisStore } from 'cache-manager-ioredis-yet';
import { parseRedisUrl } from 'parse-redis-url-simple';
import { TerminusModule } from '@nestjs/terminus';
import { Request } from 'express';
import { ActivitiesModule } from './activities/activities.module';
import { EventEmitterModule } from '@nestjs/event-emitter';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
    }),
    LoggerModule.forRoot({
      pinoHttp: {
        level: !isProd ? 'debug' : 'info',
        transport: !isProd
          ? {
              target: 'pino-pretty',
              options: {
                colorize: true,
                singleLine: true,
                levelFirst: false,
                translateTime: "yyyy-mm-dd'T'HH:MM:ss.l'Z'",
                messageFormat: '[{traceId}, {spanId}] [{context}] {msg}',
                ignore:
                  'pid,hostname,context,req,res,responseTime,traceId,spanId',
                errorLikeObjectKeys: ['err', 'error'],
              },
            }
          : undefined,
        customProps(req: Request) {
          return {
            traceId: req?.b3?.traceId,
            spanId: req?.b3?.spanId,
          };
        },
      },
    }),
    EventEmitterModule.forRoot(),
    CacheModule.registerAsync({
      isGlobal: true,
      imports: [ConfigModule],
      useFactory: async (configService: ConfigService) => {
        return {
          store: redisStore,
          ttl: Number(configService.get('CACHE_TTL')),
          ...parseRedisUrl(configService.get('REDIS_URL'))[0],
        };
      },
      inject: [ConfigService],
    }),
    PrismaModule.forRoot(),
    TerminusModule,
    TodosModule,
    AuthModule,
    UsersModule,
    ActivitiesModule,
  ],
  controllers: [AppController],
  providers: [
    {
      provide: APP_GUARD,
      useClass: JwtAuthGuard,
    },
  ],
})
export class AppModule implements OnModuleDestroy {
  private readonly logger = new Logger(AppModule.name);

  constructor(
    @Inject(CACHE_MANAGER) private readonly cacheManager: RedisCache,
  ) {}

  onModuleDestroy() {
    this.logger.log('Gracefully shutdown redis');

    this.cacheManager.store.client.disconnect();
  }
}
