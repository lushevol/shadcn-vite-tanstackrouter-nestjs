import { Body, Controller, HttpCode, HttpStatus, Post } from '@nestjs/common'
import { Public } from './decorators/public.decorator'
import { LoginDto } from './dto/login.dto'
import { AuthService } from './auth.service'
import type { LoginResponse } from './interfaces/login-response'

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Public()
  @Post('login')
  @HttpCode(HttpStatus.OK)
  login(@Body() dto: LoginDto): Promise<LoginResponse> {
    return this.authService.login(dto)
  }
}
