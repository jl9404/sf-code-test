import { Logger } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';
import * as util from 'util';

export const prismaExtensionFactory = (client: PrismaClient, logger: Logger) =>
  client.$extends({
    query: {
      $allModels: {
        async $allOperations({ operation, model, args, query }) {
          const start = performance.now();
          const result = await query(args);
          const end = performance.now();
          const time = end - start;
          logger.debug(
            util.inspect(
              { model, operation, args, time },
              { showHidden: false, depth: null, colors: true },
            ),
          );
          return result;
        },
      },
    },
  });

export type ExtendedPrismaClient = ReturnType<typeof prismaExtensionFactory>;
