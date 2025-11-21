import 'dotenv/config'
import { ValidationPipe } from '@nestjs/common'
import { ConfigService } from '@nestjs/config'
import { NestFactory } from '@nestjs/core'
import { AppModule } from './app.module'

async function bootstrap() {
  const app = await NestFactory.create(AppModule)
  app.enableCors({ origin: true })
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    }),
  )
  const configService = app.get(ConfigService)
  const port = configService.get<number>('PORT', 3000)
  await app.listen(port)
  console.log(`🚀 API server running on http://localhost:${port}`)
}

void bootstrap()
