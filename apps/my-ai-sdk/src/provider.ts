import type { ProviderV2 } from "@ai-sdk/provider";
import {
	generateId,
	loadApiKey,
	withoutTrailingSlash,
} from "@ai-sdk/provider-utils";
import { CustomChatLanguageModel } from "./custom-chat-language-model";

export interface CustomChatSettings {
	/**
	 * Optional custom headers for requests
	 */
	headers?: Record<string, string>;
}

export interface CustomProvider extends ProviderV2 {
	(modelId: string, settings?: CustomChatSettings): CustomChatLanguageModel;

	languageModel(
		modelId: string,
		settings?: CustomChatSettings,
	): CustomChatLanguageModel;
}

export interface CustomProviderSettings {
	/**
	 * Base URL for API calls
	 */
	baseURL?: string;

	/**
	 * API key for authentication
	 */
	apiKey?: string;

	/**
	 * Custom headers for requests
	 */
	headers?: Record<string, string>;

	/**
	 * Custom generateId function
	 */
	generateId?: () => string;
}

const DEFAULT_BASE_URL = "https://api.custom.ai/v1";
const DEFAULT_API_KEY_ENV = "CUSTOM_API_KEY";

export function createCustomProvider(
	options: CustomProviderSettings = {},
): CustomProvider {
	const createChatModel = (
		modelId: string,
		settings: CustomChatSettings = {},
	) =>
		new CustomChatLanguageModel(modelId, settings, {
			provider: "custom",
			baseURL: withoutTrailingSlash(options.baseURL) ?? DEFAULT_BASE_URL,
			headers: () => ({
				Authorization: `Bearer ${loadApiKey({
					apiKey: options.apiKey,
					environmentVariableName: DEFAULT_API_KEY_ENV,
					description: "Custom Provider",
				})}`,
				...options.headers,
			}),
			generateId: options.generateId ?? generateId,
		});

	const provider = function (modelId: string, settings?: CustomChatSettings) {
		if (new.target) {
			throw new Error(
				"The model factory function cannot be called with the new keyword.",
			);
		}

		return createChatModel(modelId, settings);
	};

	provider.languageModel = createChatModel;
	provider.textEmbeddingModel = (modelId: string) => {
		throw new Error("textEmbeddingModel not implemented");
	};
	provider.imageModel = (modelId: string) => {
		throw new Error("imageModel not implemented");
	};

	return provider as CustomProvider;
}

export const custom = createCustomProvider();
