import { Body, Controller, HttpCode, HttpStatus, Post } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { AuthService } from './auth.service';
import { LoginDto } from './dto/login.dto';
import { Public } from './decorators/public.decorator';
import { RegisterDto } from './dto/register.dto';

@Controller({
  path: 'auth',
  version: '1',
})
@ApiTags('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Public()
  @HttpCode(HttpStatus.OK)
  @Post('login')
  async login(@Body() credentials: LoginDto) {
    return {
      data: {
        accessToken: await this.authService.login(credentials),
      },
    };
  }

  @Public()
  @HttpCode(HttpStatus.OK)
  @Post('register')
  async register(@Body() credentials: RegisterDto) {
    return {
      data: {
        accessToken: await this.authService.register(credentials),
      },
    };
  }
}
