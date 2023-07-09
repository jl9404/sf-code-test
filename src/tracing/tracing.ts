import { CompositePropagator } from '@opentelemetry/core';
import { B3InjectEncoding, B3Propagator } from '@opentelemetry/propagator-b3';
import { NodeSDK } from '@opentelemetry/sdk-node';
import { AsyncLocalStorageContextManager } from '@opentelemetry/context-async-hooks';
import { Resource } from '@opentelemetry/resources';
import { SemanticResourceAttributes } from '@opentelemetry/semantic-conventions';
import { Logger } from '@nestjs/common';
import { NestInstrumentation } from '@opentelemetry/instrumentation-nestjs-core';
import { HttpInstrumentation } from '@opentelemetry/instrumentation-http';
import { propagation } from '@opentelemetry/api';
import { BatchSpanProcessor } from '@opentelemetry/sdk-trace-node';
import { PrismaInstrumentation } from '@prisma/instrumentation';
import { JaegerExporter } from '@opentelemetry/exporter-jaeger';
import { ExpressInstrumentation } from '@opentelemetry/instrumentation-express';
import { IORedisInstrumentation } from '@opentelemetry/instrumentation-ioredis';

let otelSdk: NodeSDK | null = null;
export function getOrCreateOtelSdk(): NodeSDK {
  if (otelSdk !== null) return otelSdk;

  propagation.setGlobalPropagator(
    new CompositePropagator({
      propagators: [
        new B3Propagator({
          injectEncoding: B3InjectEncoding.SINGLE_HEADER,
        }),
        new B3Propagator({
          injectEncoding: B3InjectEncoding.MULTI_HEADER,
        }),
      ],
    }),
  );

  const jaegerExporter = new JaegerExporter({
    endpoint: 'http://localhost:14268/api/traces',
  });

  const traceExporter = jaegerExporter;

  otelSdk = new NodeSDK({
    spanProcessor: new BatchSpanProcessor(traceExporter),
    resource: new Resource({
      [SemanticResourceAttributes.SERVICE_NAME]: 'TodoService',
    }),
    contextManager: new AsyncLocalStorageContextManager(),
    instrumentations: [
      new HttpInstrumentation(),
      new ExpressInstrumentation(),
      new NestInstrumentation({
        enabled: true,
      }),
      new PrismaInstrumentation(),
      new IORedisInstrumentation(),
    ],
  });

  const logger = new Logger('Otel');
  process.on('SIGTERM', () => {
    if (!otelSdk) {
      return;
    }

    otelSdk
      .shutdown()
      .then(
        () => logger.log('Gracefully shutdown telemetry'),
        (err) => logger.error('Error shutting down telemetry', err),
      )
      .finally(() => process.exit(0));
  });

  return otelSdk;
}
