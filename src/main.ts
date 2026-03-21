import { bootstrapOtel } from './infra/observability/tracing/otel.bootstrap';
// Initialize OpenTelemetry before importing other modules
bootstrapOtel();

import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { Logger } from 'nestjs-pino';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { apiReference } from '@scalar/nestjs-api-reference';

async function bootstrap() {
  const app = await NestFactory.create(AppModule, { bufferLogs: true });

  // Use Pino for NestJS logging
  app.useLogger(app.get(Logger));

  // Swagger Documentation Setup
  const config = new DocumentBuilder()
    .setTitle('Financial Wallet API')
    .setDescription('The Financial Wallet API description')
    .setVersion('1.0')
    .addBearerAuth()
    .build();

  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('docs-json', app, document);

  // Scalar setup (Replaces Swagger UI for a better visual)
  app.use(
    '/docs',
    apiReference({
      spec: {
        content: document,
      },
    } as any),
  );

  app.enableShutdownHooks();
  await app.listen(process.env.APP_PORT ?? 3000);
}
bootstrap();
