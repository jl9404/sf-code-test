import { context, trace } from '@opentelemetry/api';
import { NextFunction, Request, Response } from 'express';

export const b3Middleware = (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  const span = trace.getSpanContext(context.active());
  if (span) {
    req.b3 = {
      traceId: span.traceId,
      spanId: span.spanId,
    };
  }
  next();
};
