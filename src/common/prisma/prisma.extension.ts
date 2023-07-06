import { INestApplication, Logger } from '@nestjs/common';
import { Prisma, PrismaClient } from '@prisma/client';

export const prismaExtensionFactory = (
  client: PrismaClient<Prisma.PrismaClientOptions, 'query'>,
  logger: Logger,
) => {
  client.$on('query', (e) => {
    logger.debug(`${e.query} -- ${e.params} duration: ${e.duration}ms`);
  });

  return client.$extends({
    client: {
      async enableShutdownHooks(app: INestApplication) {
        Prisma.getExtensionContext(client).$on('beforeExit', async () => {
          logger.log('Gracefully shutdown prisma');

          await app.close();
        });
      },
    },
  });
};

export type ExtendedPrismaClient = ReturnType<typeof prismaExtensionFactory>;
