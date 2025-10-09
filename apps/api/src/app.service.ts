import { Injectable } from '@nestjs/common'

@Injectable()
export class AppService {
  getHello(): string {
    return 'Hello from the NestJS API!'
  }

  getAdminOverview(fullName: string) {
    return {
      message: `Welcome back, ${fullName}!`,
      generatedAt: new Date().toISOString(),
    }
  }
}
