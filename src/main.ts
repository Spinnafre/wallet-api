import { bootstrapOtel } from './infra/observability/tracing/otel.bootstrap';
bootstrapOtel();

import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { Logger } from 'nestjs-pino';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { apiReference } from '@scalar/nestjs-api-reference';
import { ConfigService } from '@nestjs/config';
import { IEnv } from '@config/env';

async function bootstrap() {
  const app = await NestFactory.create(AppModule, { bufferLogs: false });

  app.useLogger(app.get(Logger));

  const config = new DocumentBuilder()
    .setTitle('Financial Wallet API')
    .setDescription('The Financial Wallet API description')
    .setVersion('1.0')
    .addBearerAuth()
    .build();

  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('docs-json', app, document);

  app.use(
    '/docs',
    // eslint-disable-next-line @typescript-eslint/no-unsafe-argument
    apiReference({
      spec: {
        content: document,
      },
    } as any),
  );

  const configService = app.get<ConfigService<IEnv, true>>(ConfigService);

  const port = configService.get('PORT', { infer: true });

  app.get(Logger).log(`Application is running on: ${port}`);

  app.enableShutdownHooks();
  await app.listen(port);
}
bootstrap().catch((err) => {
  console.error('Fatal error during bootstrap:', err);
  process.exit(1);
});
