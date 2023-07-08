import { UsersService } from './users.service';
import { TestBed } from '@automock/jest';
import { randomUUID } from 'crypto';
import {
  PRISMA_MASTER_CONNECTION,
  PRISMA_READ_CONNECTION,
} from 'src/common/prisma/constants';
import { ExtendedPrismaClient } from 'src/common/prisma/prisma.extension';

describe('UsersService', () => {
  let service: UsersService;
  let prisma: jest.Mocked<ExtendedPrismaClient>;
  let prismaReadOnly: jest.Mocked<ExtendedPrismaClient>;

  const fixture = {
    uuid: randomUUID(),
    email: 'example@example.com',
    password:
      '$argon2id$v=19$m=65536,t=3,p=4$5fDPS3Jz0vWWg4aVtirbag$OQlHOJA0doc1PsRB6sp9P0qynSuwUw/rAOVmKrNogsM',
  };

  beforeEach(async () => {
    const { unit, unitRef } = TestBed.create(UsersService).compile();

    service = unit;
    prisma = unitRef.get(PRISMA_MASTER_CONNECTION);
    prismaReadOnly = unitRef.get(PRISMA_READ_CONNECTION);
  });

  describe('create', () => {
    it('should able to create new user', async () => {
      prisma.user.create = jest.fn().mockResolvedValue(fixture);

      const user = await service.create({
        ...fixture,
        password: 'demo',
      });

      expect(prisma.user.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          ...fixture,
          password: expect.stringContaining('$argon2'),
        }),
      });
      expect(user.email).toEqual(fixture.email);
    });
  });

  describe('findOne', () => {
    it('should find user by uuid', async () => {
      prismaReadOnly.user.findUniqueOrThrow = jest
        .fn()
        .mockResolvedValue(fixture);

      const user = await service.findOne(fixture.uuid);

      expect(prismaReadOnly.user.findUniqueOrThrow).toHaveBeenCalledWith({
        where: { uuid: fixture.uuid },
      });
      expect(user.email).toEqual(fixture.email);
    });
  });

  describe('findOneByEmail', () => {
    it('should find user by email', async () => {
      prismaReadOnly.user.findUnique = jest.fn().mockResolvedValue(fixture);

      const user = await service.findOneByEmail(fixture.email);

      expect(prismaReadOnly.user.findUnique).toHaveBeenCalledWith({
        where: { email: fixture.email },
      });
      expect(user).toEqual(fixture);
    });
  });
});
