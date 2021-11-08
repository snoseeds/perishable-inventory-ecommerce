import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ValidationPipe } from '@nestjs/common';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  app.useGlobalPipes(new ValidationPipe());
  await app.listen(+(process.env.PORT, '0.0.0.0') || 3000);
  console.log('app listening on port 3000')
}
bootstrap();
