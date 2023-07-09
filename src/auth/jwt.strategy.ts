import { Inject, Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { ConfigService } from '@nestjs/config';
import { UsersService } from 'src/users/users.service';
import { UserEntity } from 'src/users/entites/user.entity';
import { RedisCache } from 'cache-manager-ioredis-yet';
import { CACHE_MANAGER } from '@nestjs/cache-manager';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(
    configService: ConfigService,
    private readonly usersService: UsersService,
    @Inject(CACHE_MANAGER)
    private readonly cache: RedisCache,
  ) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: configService.getOrThrow('JWT_SECRET'),
    });
  }

  async validate(payload: any) {
    try {
      if (!payload.sub) {
        throw new UnauthorizedException();
      }

      const user = await this.cache.wrap(
        `user:${payload.sub}`,
        async () =>
          new UserEntity(await this.usersService.findOne(payload.sub)),
      );

      return new UserEntity(user);
    } catch (e) {
      throw new UnauthorizedException();
    }
  }
}
