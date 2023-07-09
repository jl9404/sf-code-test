import { accessibleBy } from '@casl/prisma';
import { ParsedQuery } from '@luxury-presence/nestjs-jsonapi';
import { Injectable, Logger } from '@nestjs/common';
import { Activity } from '@prisma/client';
import { CaslAbilityFactory } from 'src/auth/casl-ability.factory';
import { ParsedQueryTransformer } from 'src/common/parsed-query.transformer';
import { InjectReadOnlyPrisma } from 'src/common/prisma/prisma.decorator';
import { ExtendedPrismaClient } from 'src/common/prisma/prisma.extension';
import { UserEntity } from 'src/users/entites/user.entity';
import { activityParsingConfig } from './constants';
import { Action } from 'src/auth/constants';
import { ActivityEntity } from './entities/activity.entity';
import { DEFAULT_PAGE_LIMIT } from 'src/common/constants';

@Injectable()
export class ActivitiesService {
  private readonly logger = new Logger(ActivitiesService.name);

  constructor(
    @InjectReadOnlyPrisma()
    private readonly readOnlyPrisma: ExtendedPrismaClient,
    private readonly caslAbilityFactory: CaslAbilityFactory,
  ) {}

  async findAll(user: UserEntity, params?: ParsedQuery<Activity>) {
    const ability = this.caslAbilityFactory.createForUser(user);

    const transformer = new ParsedQueryTransformer<Activity>(
      activityParsingConfig,
    );

    const args = transformer.transform(params);

    const activities = await this.readOnlyPrisma.activity.findMany({
      ...args,
      where: {
        AND: [accessibleBy(ability, Action.Read).Activity, args.where || {}],
      },
      include: {
        actor: true,
      },
    });

    return activities.map(
      (activity) => new ActivityEntity(activity, activity.actor),
    );
  }

  async count(user: UserEntity, params?: ParsedQuery<Activity>) {
    const ability = this.caslAbilityFactory.createForUser(user);

    const transformer = new ParsedQueryTransformer<Activity>(
      activityParsingConfig,
    );

    const args = transformer.transform(params);

    return await this.readOnlyPrisma.activity.count({
      where: {
        AND: [accessibleBy(ability, Action.Read).Todo, args.where || {}],
      },
    });
  }

  async findAllAndCount(user: UserEntity, params: ParsedQuery<Activity>) {
    const total = await this.count(user, params);

    const pagination = {
      page: params.page?.on || 1,
      pageSize: params.page?.limit || DEFAULT_PAGE_LIMIT,
      pageCount: Math.ceil(total / (params.page?.limit || DEFAULT_PAGE_LIMIT)),
      total,
    };

    if (total === 0 || pagination.page > pagination.pageCount) {
      this.logger.log(
        '[findAllAndCount] Invalid current page, skipping fetch activities',
      );

      return { activities: [], pagination };
    }

    return {
      activities: await this.findAll(user, params),
      pagination,
    };
  }
}
