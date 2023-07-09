import { Action, Model } from '@prisma/client';

export class DeltaChangedEvent {
  model: Model;

  action: Action;

  actorId: bigint;

  beforePayload?: object;

  afterPayload?: object;

  constructor(partial: Partial<DeltaChangedEvent>) {
    Object.assign(this, partial);
  }
}
