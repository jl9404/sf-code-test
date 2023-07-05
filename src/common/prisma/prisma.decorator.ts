import { Inject } from '@nestjs/common';
import { PRISMA_MASTER_CONNECTION, PRISMA_READ_CONNECTION } from './constants';

export const InjectPrisma = () => Inject(PRISMA_MASTER_CONNECTION);

export const InjectReadOnlyPrisma = () => Inject(PRISMA_READ_CONNECTION);
