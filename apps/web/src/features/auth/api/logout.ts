import { apiClient } from "@/lib/api-client";

export async function logout(refreshToken: string): Promise<void> {
	await apiClient.post("/auth/logout", { refreshToken });
}
