import { randomBytes, randomUUID } from "node:crypto";
import { Injectable, UnauthorizedException } from "@nestjs/common";
import type { JwtService } from "@nestjs/jwt";
import bcrypt from "bcrypt";
import { eq } from "drizzle-orm";
import { db } from "../db/db";
import {
	refreshTokens,
	roles as rolesTable,
	userRoles as userRolesTable,
	users,
} from "../db/schema";
import type { LoginDto } from "./dto/login.dto";
import type { RefreshTokenDto } from "./dto/refresh-token.dto";
import type { AuthenticatedUser } from "./interfaces/authenticated-user";
import type { JwtPayload } from "./interfaces/jwt-payload";
import type { LoginResponse } from "./interfaces/login-response";

@Injectable()
export class AuthService {
	private readonly accessTokenTtlSeconds = 60 * 60; // 1 hour
	private readonly refreshTokenTtlSeconds = 60 * 60 * 24 * 7; // 7 days

	constructor(private readonly jwtService: JwtService) {}

	private async validateUser({
		email,
		password,
	}: LoginDto): Promise<AuthenticatedUser> {
		const normalizedEmail = email.trim().toLowerCase();

		const userRecord = await db.query.users.findFirst({
			where: eq(users.email, normalizedEmail),
		});

		if (!userRecord) {
			throw new UnauthorizedException("Invalid email or password !");
		}

		const passwordValid = await bcrypt.compare(
			password,
			userRecord.passwordHash,
		);

		if (!passwordValid) {
			throw new UnauthorizedException("Invalid email or password");
		}

		return this.buildAuthenticatedUser(userRecord);
	}

	private async buildAuthenticatedUser(
		userRecord: typeof users.$inferSelect,
	): Promise<AuthenticatedUser> {
		const roleRecords = await db
			.select({ roleName: rolesTable.name })
			.from(userRolesTable)
			.innerJoin(rolesTable, eq(userRolesTable.roleId, rolesTable.id))
			.where(eq(userRolesTable.userId, userRecord.id));

		return {
			id: userRecord.id,
			email: userRecord.email,
			fullName: userRecord.fullName,
			accountNumber: userRecord.accountNumber,
			roles: roleRecords.map((record) => record.roleName),
		};
	}

	private async getUserById(userId: number): Promise<AuthenticatedUser> {
		const userRecord = await db.query.users.findFirst({
			where: eq(users.id, userId),
		});

		if (!userRecord) {
			throw new UnauthorizedException("Invalid refresh token");
		}

		return this.buildAuthenticatedUser(userRecord);
	}

	private buildJwtPayload(user: AuthenticatedUser): JwtPayload {
		return {
			sub: user.id,
			email: user.email,
			roles: user.roles,
			accountNumber: user.accountNumber,
			fullName: user.fullName,
		};
	}

	private async persistRefreshToken(
		userId: number,
		secret: string,
	): Promise<{ refreshToken: string; refreshExpiresIn: number }> {
		const refreshExpiresIn = this.refreshTokenTtlSeconds;
		const now = Date.now();
		const sessionId = randomUUID();
		const refreshToken = `${sessionId}.${secret}`;

		await db
			.delete(refreshTokens)
			.where(eq(refreshTokens.userId, userId))
			.run();

		await db
			.insert(refreshTokens)
			.values({
				id: sessionId,
				userId,
				tokenHash: await bcrypt.hash(secret, 10),
				createdAt: new Date(now),
				expiresAt: new Date(now + refreshExpiresIn * 1000),
			})
			.run();

		return { refreshToken, refreshExpiresIn };
	}

	private async issueSession(user: AuthenticatedUser): Promise<LoginResponse> {
		const payload = this.buildJwtPayload(user);
		const expiresIn = this.accessTokenTtlSeconds;

		const accessToken = await this.jwtService.signAsync(payload, {
			expiresIn,
		});

		const secret = randomBytes(48).toString("hex");
		const { refreshToken, refreshExpiresIn } = await this.persistRefreshToken(
			user.id,
			secret,
		);

		return {
			accessToken,
			refreshToken,
			expiresIn,
			refreshExpiresIn,
			tokenType: "Bearer",
			user,
		};
	}

	private parseRefreshToken(refreshToken: string): {
		sessionId: string;
		secret: string;
	} {
		const [sessionId, secret] = refreshToken.split(".");
		if (!sessionId || !secret) {
			throw new UnauthorizedException("Invalid refresh token");
		}
		return { sessionId, secret };
	}

	private async revokeRefreshToken(sessionId: string): Promise<void> {
		await db.delete(refreshTokens).where(eq(refreshTokens.id, sessionId)).run();
	}

	async login(dto: LoginDto): Promise<LoginResponse> {
		const user = await this.validateUser(dto);
		return this.issueSession(user);
	}

	async refresh(dto: RefreshTokenDto): Promise<LoginResponse> {
		const { sessionId, secret } = this.parseRefreshToken(dto.refreshToken);
		const storedToken = await db.query.refreshTokens.findFirst({
			where: eq(refreshTokens.id, sessionId),
		});

		if (!storedToken || storedToken.revokedAt) {
			throw new UnauthorizedException("Invalid refresh token");
		}

		if (storedToken.expiresAt <= new Date()) {
			await this.revokeRefreshToken(sessionId);
			throw new UnauthorizedException("Refresh token expired");
		}

		const matches = await bcrypt.compare(secret, storedToken.tokenHash);
		if (!matches) {
			await this.revokeRefreshToken(sessionId);
			throw new UnauthorizedException("Invalid refresh token");
		}

		const user = await this.getUserById(storedToken.userId);

		await this.revokeRefreshToken(sessionId);
		return this.issueSession(user);
	}

	async logout(dto: RefreshTokenDto): Promise<void> {
		const { sessionId, secret } = this.parseRefreshToken(dto.refreshToken);
		const storedToken = await db.query.refreshTokens.findFirst({
			where: eq(refreshTokens.id, sessionId),
		});

		if (!storedToken) {
			return;
		}

		const matches = await bcrypt.compare(secret, storedToken.tokenHash);
		if (!matches) {
			await this.revokeRefreshToken(sessionId);
			throw new UnauthorizedException("Invalid refresh token");
		}

		await this.revokeRefreshToken(sessionId);
	}
}
