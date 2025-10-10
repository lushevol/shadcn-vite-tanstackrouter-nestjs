import { Injectable, UnauthorizedException } from '@nestjs/common'
import { JwtService } from '@nestjs/jwt'
import bcrypt from 'bcrypt'
import { eq } from 'drizzle-orm'
import { db } from '../db/db'
import {
  roles as rolesTable,
  userRoles as userRolesTable,
  users,
} from '../db/schema'
import { LoginDto } from './dto/login.dto'
import { AuthenticatedUser } from './interfaces/authenticated-user'
import { JwtPayload } from './interfaces/jwt-payload'
import { LoginResponse } from './interfaces/login-response'

@Injectable()
export class AuthService {
  constructor(private readonly jwtService: JwtService) {}

  private async validateUser({ email, password }: LoginDto): Promise<AuthenticatedUser> {
    const user = await db.query.users.findFirst({
      where: eq(users.email, email),
    })

    if (!user) {
      throw new UnauthorizedException('Invalid email or password !')
    }
    
    const passwordValid = await bcrypt.compare(password, user.passwordHash)

    if (!passwordValid) {
      throw new UnauthorizedException('Invalid email or password')
    }

    const roleRecords = await db
      .select({ roleName: rolesTable.name })
      .from(userRolesTable)
      .innerJoin(rolesTable, eq(userRolesTable.roleId, rolesTable.id))
      .where(eq(userRolesTable.userId, user.id))

    return {
      id: user.id,
      email: user.email,
      fullName: user.fullName,
      accountNumber: user.accountNumber,
      roles: roleRecords.map((record) => record.roleName),
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
