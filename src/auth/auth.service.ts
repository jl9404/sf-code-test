import { Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as argon2 from 'argon2';
import { UsersService } from 'src/users/users.service';
import { LoginDto } from './dto/login.dto';
import { RegisterDto } from './dto/register.dto';
import { User } from '@prisma/client';

@Injectable()
export class AuthService {
  constructor(
    private readonly usersService: UsersService,
    private readonly jwtService: JwtService,
  ) {}

  async register(credentials: RegisterDto) {
    const { email, password } = credentials;

    const user = await this.usersService.create({ email, password });

    return this.signUserJwt(user);
  }

  async login(credentials: LoginDto) {
    const { email, password } = credentials;

    const user = await this.usersService.findOneByEmail(email);

    if (!user || !(await argon2.verify(user.password, password))) {
      throw new UnauthorizedException();
    }

    return this.signUserJwt(user);
  }

  private signUserJwt(user: User) {
    return this.jwtService.sign({
      sub: user.uuid,
    });
  }
}
