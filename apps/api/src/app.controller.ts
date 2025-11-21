import { Controller, Get, Req } from '@nestjs/common'
import type { Request } from 'express'
import { AppService } from './app.service'
import { Public } from './auth/decorators/public.decorator'
import { Roles } from './auth/decorators/roles.decorator'
import type { JwtPayload } from './auth/interfaces/jwt-payload'

@Controller()
export class AppController {
  constructor(private readonly appService: AppService) {}

  @Public()
  @Get()
  getHello(): string {
    return this.appService.getHello()
  }

  @Roles('admin')
  @Get('admin/overview')
  getAdminOverview(@Req() request: Request) {
    const user = request.user as JwtPayload
    return this.appService.getAdminOverview(user.fullName)
  }
}
