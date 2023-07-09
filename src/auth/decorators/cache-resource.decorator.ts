import { SetMetadata } from '@nestjs/common';
import { ClassConstructor } from 'class-transformer';

export const CACHE_RESOURCE_KEY = 'CACHE_RESOURCE_KEY';
export const CacheResource = <T>(resource: ClassConstructor<T>) =>
  SetMetadata(CACHE_RESOURCE_KEY, resource);
