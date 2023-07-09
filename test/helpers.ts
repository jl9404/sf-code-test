import { Prisma } from '@prisma/client';
import { ExtendedPrismaClient } from 'src/common/prisma/prisma.extension';

export const clearDb = async (prisma: ExtendedPrismaClient) => {
  const tables = Prisma.dmmf.datamodel.models
    .map((model) => model.dbName || model.name)
    .filter((table) => table);

  await prisma.$transaction([
    ...tables.map((table) =>
      prisma.$executeRawUnsafe(`TRUNCATE "${table}" CASCADE;`),
    ),
  ]);
};
