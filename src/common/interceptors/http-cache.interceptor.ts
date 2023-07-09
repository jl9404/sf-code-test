import { CacheInterceptor } from '@nestjs/cache-manager';
import { Injectable, ExecutionContext, CallHandler } from '@nestjs/common';
import { Request } from 'express';
import { UserEntity } from 'src/users/entites/user.entity';
import * as objectHash from 'object-hash';
import { Observable, map } from 'rxjs';
import {
  Data,
  ResourceObject,
  SuccessResponse,
} from '@luxury-presence/nestjs-jsonapi';
import { ClassConstructor, plainToClass } from 'class-transformer';
import { CACHE_RESOURCE_KEY } from 'src/auth/decorators/cache-resource.decorator';
import { BaseEntity } from '../prisma/base.entity';

@Injectable()
export class HttpCacheInterceptor extends CacheInterceptor {
  async intercept(
    context: ExecutionContext,
    next: CallHandler,
  ): Promise<Observable<any>> {
    return (await super.intercept(context, next)).pipe(
      map((response: SuccessResponse<Data<object>>) => {
        const entity: ClassConstructor<BaseEntity> =
          this.reflector.get(CACHE_RESOURCE_KEY, context.getHandler()) ||
          this.reflector.get(CACHE_RESOURCE_KEY, context.getClass());

        if (!entity) {
          return response;
        }

        if (response?.data !== null) {
          const firstItem = [response.data].flat().shift();

          if (firstItem && !(firstItem instanceof ResourceObject)) {
            return SuccessResponse.of(
              plainToClass(
                entity,
                !Array.isArray(response.data)
                  ? response.data.attributes
                  : response.data.map(({ attributes }) => attributes),
              ),
              response.meta,
              response.links,
            );
          }
        }

        return response;
      }),
    );
  }

  trackBy(context: ExecutionContext): string | undefined {
    // use original one to check whether is http request
    const originalTrackBy = super.trackBy(context);

    if (!originalTrackBy) {
      return undefined;
    }

    const request: Request = context.getArgByIndex(0);

    const user = request.user as UserEntity;

    // TODO: works for express only
    return `cache:${request.method}:${request.path}:${
      user ? `${user.id}:` : ''
    }${objectHash(request.query)}`;
  }
}
