import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { HttpExceptionFilter } from './common/filters/http-exception.filter';
import { getAppConfig } from './config/app.config';

async function bootstrap() {
  const appConfig = getAppConfig();
  const app = await NestFactory.create(AppModule);
  app.enableCors({
    origin: appConfig.webOrigin,
  });
  app.useGlobalFilters(new HttpExceptionFilter());

  await app.listen(appConfig.port);
}
void bootstrap();
