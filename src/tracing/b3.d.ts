declare namespace Express {
  export interface Request {
    b3?: { traceId: string; spanId: string };
  }
}
