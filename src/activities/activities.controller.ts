import { Controller, Get, UseGuards } from '@nestjs/common';
import { ActivitiesService } from './activities.service';
import { ActivityEntity } from './entities/activity.entity';
import { Action } from 'src/auth/constants';
import { activityParsingConfig } from './constants';
import { Activity } from '@prisma/client';
import {
  successResponseSchema,
  ParseJsonApiQuery,
  ParsedQuery,
  SuccessResponse,
} from '@luxury-presence/nestjs-jsonapi';
import {
  ApiBearerAuth,
  ApiExtraModels,
  ApiOkResponse,
  ApiTags,
} from '@nestjs/swagger';
import { CheckPolicies } from 'src/auth/decorators/check-policies.decorator';
import { CurrentUser } from 'src/auth/decorators/current-user.decorator';
import { PoliciesGuard } from 'src/auth/policies.guard';
import { ApiFilterQuery } from 'src/common/decorators/api-filter-query.decorator';
import { UserEntity } from 'src/users/entites/user.entity';

@Controller({
  path: 'activities',
  version: '1',
})
@ApiTags('activities')
@ApiExtraModels(ActivityEntity)
export class ActivitiesController {
  constructor(private readonly activitiesService: ActivitiesService) {}

  @Get()
  @ApiBearerAuth('auth')
  @ApiOkResponse({
    schema: successResponseSchema([ActivityEntity]),
  })
  @ApiFilterQuery(activityParsingConfig)
  @UseGuards(PoliciesGuard)
  @CheckPolicies((ability) => ability.can(Action.Read, 'Activity'))
  async findAll(
    @CurrentUser() user: UserEntity,
    @ParseJsonApiQuery<Activity>({
      config: activityParsingConfig,
    })
    params: ParsedQuery<Activity>,
  ) {
    const { activities, pagination } =
      await this.activitiesService.findAllAndCount(user, params);

    return SuccessResponse.of(activities, { pagination });
  }
}
