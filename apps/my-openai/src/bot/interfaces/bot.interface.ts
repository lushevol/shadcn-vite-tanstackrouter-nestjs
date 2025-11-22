export interface BotRequest {
	messages: Array<{ role: string; content: string }>;
	tools?: any[];
	userId?: string;
	isJsonMode?: boolean;
}

export interface BotResponse {
	content?: string;
	tool_calls?: any[];
}
