import { ValidationPipe } from "@nestjs/common";
import { NestFactory } from "@nestjs/core";
import { AppModule } from "./app.module";

async function bootstrap() {
	const app = await NestFactory.create(AppModule);

	// Enable Validation for DTOs
	app.useGlobalPipes(
		new ValidationPipe({
			transform: true,
			whitelist: true,
			forbidNonWhitelisted: false, // Important: don't crash on unknown params like 'top_p'
		}),
	);

	app.enableCors(); // Allow frontend access
	await app.listen(3000);
	console.log("OpenAI Wrapper running on http://localhost:3000");
}
bootstrap();
