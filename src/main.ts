import * as dotenv from 'dotenv';
dotenv.config();
import { getOrCreateOtelSdk } from './tracing/tracing';
getOrCreateOtelSdk().start();

import { HttpAdapterHost, NestFactory, Reflector } from '@nestjs/core';
import { AppModule } from './app.module';
import {
  ClassSerializerInterceptor,
  ValidationPipe,
  VersioningType,
} from '@nestjs/common';
import { PrismaClientExceptionFilter } from 'nestjs-prisma';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { Logger } from 'nestjs-pino';
import {
  PRISMA_MASTER_CONNECTION,
  PRISMA_READ_CONNECTION,
} from './common/prisma/constants';
import { ExtendedPrismaClient } from './common/prisma/prisma.extension';
import {
  ResourceObject,
  SuccessResponse,
} from '@luxury-presence/nestjs-jsonapi';
import helmet from 'helmet';
import * as compression from 'compression';
import { b3Middleware } from './tracing/b3.middleware';

async function bootstrap() {
  // TODO: enable fastify later?
  const app = await NestFactory.create(
    AppModule,
    // new FastifyAdapter(),
    { bufferLogs: true },
  );
  app.useLogger(app.get(Logger));
  app.useGlobalPipes(new ValidationPipe({ whitelist: true }));
  app.useGlobalInterceptors(new ClassSerializerInterceptor(app.get(Reflector)));
  app.enableVersioning({
    type: VersioningType.URI,
  });
  const { httpAdapter } = app.get(HttpAdapterHost);
  app.useGlobalFilters(new PrismaClientExceptionFilter(httpAdapter));

  const config = new DocumentBuilder()
    .setTitle('Code Test API Doc')
    .setVersion('v1')
    .addBearerAuth({ type: 'http' }, 'auth')
    .build();

  const document = SwaggerModule.createDocument(app, config, {
    extraModels: [SuccessResponse, ResourceObject],
  });
  SwaggerModule.setup('docs', app, document);

  for (const connection of [PRISMA_MASTER_CONNECTION, PRISMA_READ_CONNECTION]) {
    const prisma: ExtendedPrismaClient = app.get(connection);
    await prisma.enableShutdownHooks(app);
  }

  app.use(compression());
  app.use(helmet());
  app.use(b3Middleware);

  await app.listen(3000);
}
bootstrap();
