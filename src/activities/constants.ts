import { ParsingConfig } from '@luxury-presence/nestjs-jsonapi';
import { Activity } from '@prisma/client';

export const activityParsingConfig: ParsingConfig<Activity> = {
  sortableColumns: ['createdAt'],
  defaultLimit: 10,
  defaultSort: [['createdAt', 'DESC']],
  maxLimit: 100,
};
