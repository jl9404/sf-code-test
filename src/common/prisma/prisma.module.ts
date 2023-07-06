import { DynamicModule, Logger, Module } from '@nestjs/common';
import { PRISMA_MASTER_CONNECTION, PRISMA_READ_CONNECTION } from './constants';
import { PrismaService } from './prisma.service';
import { prismaExtensionFactory } from './prisma.extension';
import { ConfigService } from '@nestjs/config';

@Module({})
export class PrismaModule {
  static forRoot(): DynamicModule {
    return {
      global: true,
      module: PrismaModule,
      providers: [
        {
          provide: PRISMA_MASTER_CONNECTION,
          useFactory: () => {
            const logger = new Logger(PRISMA_MASTER_CONNECTION);

            return prismaExtensionFactory(
              new PrismaService({
                log: [{ emit: 'event', level: 'query' }],
              }),
              logger,
            );
          },
        },
        {
          provide: PRISMA_READ_CONNECTION,
          useFactory: (configService: ConfigService) => {
            const logger = new Logger(PRISMA_READ_CONNECTION);

            return prismaExtensionFactory(
              new PrismaService({
                datasources: {
                  db: {
                    url: configService.get('READ_REPLICATION_DATABASE_URL'),
                  },
                },
                log: [{ emit: 'event', level: 'query' }],
              }),
              logger,
            );
          },
          inject: [ConfigService],
        },
      ],
      exports: [PRISMA_MASTER_CONNECTION, PRISMA_READ_CONNECTION],
    };
  }
}
