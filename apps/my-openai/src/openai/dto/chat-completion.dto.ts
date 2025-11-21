import { Type } from "class-transformer";
import {
	IsArray,
	IsBoolean,
	IsNumber,
	IsObject,
	IsOptional,
	IsString,
	ValidateNested,
} from "class-validator";

class ImageUrlDto {
	@IsString() url: string;
}

class ContentPartDto {
	@IsString() type: "text" | "image_url";
	@IsOptional() @IsString() text?: string;
	@IsOptional()
	@ValidateNested()
	@Type(() => ImageUrlDto)
	image_url?: ImageUrlDto;
}

class MessageDto {
	@IsString() role: string;
	// Handle String OR Array (Multimodal)
	@IsOptional() content?: string | ContentPartDto[];
	@IsOptional() @IsArray() tool_calls?: any[];
	@IsOptional() @IsString() tool_call_id?: string;
}

class ResponseFormatDto {
	@IsString() type: "text" | "json_object" | "json_schema";
}

export class CreateChatCompletionDto {
	@IsString() model: string;

	@IsArray()
	@ValidateNested({ each: true })
	@Type(() => MessageDto)
	messages: MessageDto[];

	@IsBoolean() @IsOptional() stream?: boolean;

	// Tools & Functions
	@IsArray() @IsOptional() tools?: any[];
	@IsOptional() tool_choice?: any;

	// Controls
	@IsOptional() stop?: string | string[];
	@IsOptional() @IsNumber() temperature?: number;
	@IsOptional()
	@ValidateNested()
	@Type(() => ResponseFormatDto)
	response_format?: ResponseFormatDto;
	@IsOptional() @IsString() user?: string;
}
