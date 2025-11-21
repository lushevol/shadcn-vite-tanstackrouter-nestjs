export interface BotRequest {
	messages: any[];
	tools?: any[];
	userId?: string;
	isJsonMode?: boolean;
}

export interface BotResponse {
	content?: string;
	tool_calls?: any[];
}
