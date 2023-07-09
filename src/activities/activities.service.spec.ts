import { ActivitiesService } from './activities.service';
import { TestBed } from '@automock/jest';
import { CaslAbilityFactory } from 'src/auth/casl-ability.factory';
import {
  PRISMA_MASTER_CONNECTION,
  PRISMA_READ_CONNECTION,
} from 'src/common/prisma/constants';
import { ExtendedPrismaClient } from 'src/common/prisma/prisma.extension';

describe('ActivitiesService', () => {
  let service: ActivitiesService;
  let prisma: jest.Mocked<ExtendedPrismaClient>;
  let prismaReadOnly: jest.Mocked<ExtendedPrismaClient>;

  beforeEach(async () => {
    const { unit, unitRef } = TestBed.create(ActivitiesService)
      .mock(CaslAbilityFactory)
      .using(new CaslAbilityFactory())
      .compile();

    service = unit;
    prisma = unitRef.get(PRISMA_MASTER_CONNECTION);
    prismaReadOnly = unitRef.get(PRISMA_READ_CONNECTION);
  });

  describe('findAll', () => {
    // TODO
  });

  describe('count', () => {
    // TODO
  });

  describe('findAllAndCount', () => {
    // TODO
  });
});
