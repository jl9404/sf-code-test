export class BaseEntity<Entity = unknown> {
  constructor(partial: Partial<Entity>) {
    Object.assign(this, partial);
  }

  toJSON() {
    return Object.fromEntries(
      Object.entries(this).map(([key, value]) => [
        key,
        typeof value === 'bigint' ? value.toString() : value,
      ]),
    );
  }
}
