import { Op, ParsingConfig } from '@luxury-presence/nestjs-jsonapi';
import { Status, Todo } from '@prisma/client';
import { isDate, isIn } from 'class-validator';

export const todoParsingConfig: ParsingConfig<Todo> = {
  sortableColumns: ['name', 'status', 'dueAt', 'createdAt'],
  filterableColumns: {
    status: [Op.$eq, Op.$in],
    dueAt: [Op.$btw, Op.$lte, Op.$gte],
  },
  filterValidations: {
    status: (values: unknown) => {
      const availableStatus = Object.values(Status);

      return [values].flat().every((value) => isIn(value, availableStatus));
    },
    dueAt: (values) => {
      return [values].flat().every((value) => isDate(value));
    },
  },
  filterFieldTransforms: {
    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
    // @ts-ignore
    dueAt: (value: string) => {
      return new Date(value);
    },
  },
  defaultLimit: 10,
  defaultSort: [['createdAt', 'DESC']],
  maxLimit: 100,
};
