import axios, { type AxiosError, type InternalAxiosRequestConfig } from "axios";
import type { AuthUser } from "@/stores/auth-store";
import { useAuthStore } from "@/stores/auth-store";

const API_BASE_URL = import.meta.env.VITE_API_URL ?? "http://localhost:3001";

export const apiClient = axios.create({
	baseURL: API_BASE_URL,
});

interface AuthRequestConfig extends InternalAxiosRequestConfig {
	_retry?: boolean;
	_skipAuthRefresh?: boolean;
}

interface AuthSessionResponse {
	accessToken: string;
	refreshToken: string;
	expiresIn: number;
	refreshExpiresIn: number;
	tokenType: "Bearer";
	user: AuthUser;
}

const refreshClient = axios.create({
	baseURL: API_BASE_URL,
});

const authStore = () => useAuthStore.getState().auth;
const AUTH_ENDPOINTS_BYPASS = ["/auth/login", "/auth/refresh", "/auth/logout"];

function redirectToSignIn() {
	if (typeof window === "undefined") return;

	const redirect = `${window.location.pathname}${window.location.search}`;
	if (!window.location.pathname.startsWith("/sign-in")) {
		window.location.href = `/sign-in?redirect=${encodeURIComponent(redirect)}`;
	}
}

function handleUnauthorized() {
	authStore().reset();
	redirectToSignIn();
}

let ongoingRefresh: Promise<AuthSessionResponse> | null = null;

function shouldBypassRefresh(config?: AuthRequestConfig): boolean {
	if (!config?.url) return false;
	return AUTH_ENDPOINTS_BYPASS.some((endpoint) =>
		config.url?.includes(endpoint),
	);
}

async function refreshSession(
	refreshToken: string,
): Promise<AuthSessionResponse> {
	if (!ongoingRefresh) {
		ongoingRefresh = refreshClient
			.post<AuthSessionResponse>("/auth/refresh", { refreshToken })
			.then((response) => {
				const data = response.data;
				authStore().setSession({
					accessToken: data.accessToken,
					refreshToken: data.refreshToken,
					refreshExpiresIn: data.refreshExpiresIn,
					user: data.user,
				});
				return data;
			})
			.finally(() => {
				ongoingRefresh = null;
			});
	}

	return ongoingRefresh;
}

apiClient.interceptors.request.use((config: AuthRequestConfig) => {
	const token = authStore().accessToken;
	if (token) {
		config.headers = config.headers ?? {};
		config.headers.Authorization = `Bearer ${token}`;
	}
	return config;
});

apiClient.interceptors.response.use(
	(response) => response,
	async (error: AxiosError) => {
		const config = error.config as AuthRequestConfig | undefined;

		if (!axios.isAxiosError(error)) {
			return Promise.reject(error);
		}

		const status = error.response?.status;
		if (
			(status === 401 || status === 403) &&
			config &&
			!config._retry &&
			!config._skipAuthRefresh &&
			!shouldBypassRefresh(config)
		) {
			const refreshToken = authStore().getRefreshToken();

			if (refreshToken) {
				try {
					config._retry = true;
					const session = await refreshSession(refreshToken);
					config.headers = config.headers ?? {};
					config.headers.Authorization = `Bearer ${session.accessToken}`;
					return apiClient.request(config);
				} catch (refreshError) {
					handleUnauthorized();
					return Promise.reject(refreshError);
				}
			} else {
				handleUnauthorized();
				if (status === 401 || status === 403) {
					return Promise.reject(error);
				}
			}
		}

		if (status === 401 || status === 403) {
			handleUnauthorized();
		}

		return Promise.reject(error);
	},
);
