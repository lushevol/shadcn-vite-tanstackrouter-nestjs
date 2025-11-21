import { apiClient } from "@/lib/api-client";
import type { AuthUser } from "@/stores/auth-store";

export interface LoginRequest {
	email: string;
	password: string;
}

export interface LoginResponse {
	accessToken: string;
	refreshToken: string;
	expiresIn: number;
	refreshExpiresIn: number;
	tokenType: "Bearer";
	user: AuthUser;
}

export async function login(request: LoginRequest): Promise<LoginResponse> {
	const { data } = await apiClient.post<LoginResponse>("/auth/login", request);
	return data;
}
