import { Injectable, UnauthorizedException } from '@nestjs/common'
import { JwtService } from '@nestjs/jwt'
import bcrypt from 'bcrypt'
import { eq } from 'drizzle-orm'
import { db } from '../db/db'
import { users } from '../db/schema'
import { LoginDto } from './dto/login.dto'
import { JwtPayload } from './interfaces/jwt-payload'

interface AuthenticatedUser {
  id: number
  email: string
  fullName: string
  accountNumber: string
  roles: string[]
}

interface LoginResponse {
  accessToken: string
  expiresIn: number
  tokenType: 'Bearer'
  user: AuthenticatedUser
}

@Injectable()
export class AuthService {
  constructor(private readonly jwtService: JwtService) {}

  private async validateUser({ email, password }: LoginDto): Promise<AuthenticatedUser> {
    const user = await db.query.users.findFirst({
      where: eq(users.email, email),
      with: {
        userRoles: {
          with: {
            role: true,
          },
        },
      },
    })

    if (!user) {
      throw new UnauthorizedException('Invalid email or password')
    }

    const passwordValid = await bcrypt.compare(password, user.passwordHash)

    if (!passwordValid) {
      throw new UnauthorizedException('Invalid email or password')
    }

    return {
      id: user.id,
      email: user.email,
      fullName: user.fullName,
      accountNumber: user.accountNumber,
      roles: user.userRoles.map((userRole) => userRole.role.name),
    }
  }

  async login(dto: LoginDto): Promise<LoginResponse> {
    const user = await this.validateUser(dto)

    const payload: JwtPayload = {
      sub: user.id,
      email: user.email,
      roles: user.roles,
      accountNumber: user.accountNumber,
      fullName: user.fullName,
    }

    const expiresIn = 60 * 60 // 1 hour in seconds

    const accessToken = await this.jwtService.signAsync(payload, {
      expiresIn,
    })

    return {
      accessToken,
      expiresIn,
      tokenType: 'Bearer',
      user,
    }
  }
}
