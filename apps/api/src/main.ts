import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { getAppConfig } from './config/app.config';

async function bootstrap() {
  const appConfig = getAppConfig();
  const app = await NestFactory.create(AppModule);
  app.enableCors({
    origin: appConfig.webOrigin,
  });

  await app.listen(appConfig.port);
}
void bootstrap();
