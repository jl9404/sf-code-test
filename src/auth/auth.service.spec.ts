import { AuthService } from './auth.service';
import { UsersService } from 'src/users/users.service';
import { TestBed } from '@automock/jest';
import { randomUUID } from 'crypto';
import { JwtService } from '@nestjs/jwt';
import { UnauthorizedException } from '@nestjs/common';

describe('AuthService', () => {
  let service: AuthService;
  let usersService: jest.Mocked<UsersService>;
  let jwtService: jest.Mocked<JwtService>;

  const fixture = {
    id: BigInt(1),
    uuid: randomUUID(),
    email: 'example@example.com',
    password:
      '$argon2id$v=19$m=65536,t=3,p=4$5fDPS3Jz0vWWg4aVtirbag$OQlHOJA0doc1PsRB6sp9P0qynSuwUw/rAOVmKrNogsM',
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  beforeEach(async () => {
    const { unit, unitRef } = TestBed.create(AuthService).compile();

    service = unit;
    usersService = unitRef.get(UsersService);
    jwtService = unitRef.get(JwtService);
  });

  describe('register', () => {
    it('should register new user', async () => {
      usersService.create.mockResolvedValue(fixture);
      jwtService.sign.mockReturnValue('jwt');

      await expect(
        service.register({ email: fixture.email, password: 'demo' }),
      ).resolves.toBe('jwt');
    });
  });

  describe('login', () => {
    it('should login user', async () => {
      usersService.findOneByEmail.mockResolvedValue(fixture);
      jwtService.sign.mockReturnValue('jwt');

      await expect(
        service.login({ email: fixture.email, password: '123456' }),
      ).resolves.toBe('jwt');
    });

    it('should throw error if user is not found', async () => {
      usersService.findOneByEmail.mockResolvedValue(null);

      await expect(
        service.login({ email: fixture.email, password: '123456' }),
      ).rejects.toThrowError(UnauthorizedException);
    });

    it('should throw error if password is wrong', async () => {
      usersService.findOneByEmail.mockResolvedValue(fixture);

      await expect(
        service.login({ email: fixture.email, password: 'wrong' }),
      ).rejects.toThrowError(UnauthorizedException);
    });
  });
});
