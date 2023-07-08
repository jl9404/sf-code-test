import { Op, ParsingConfig } from '@luxury-presence/nestjs-jsonapi';
import { Priority, Status, Todo } from '@prisma/client';
import { isDate, isIn } from 'class-validator';

export const todoParsingConfig: ParsingConfig<Todo> = {
  sortableColumns: ['name', 'status', 'dueAt', 'createdAt', 'priority'],
  filterableColumns: {
    status: [Op.$eq, Op.$in],
    priority: [Op.$eq, Op.$in],
    tags: [Op.$eq, Op.$in],
    dueAt: [Op.$btw, Op.$lte, Op.$gte],
  },
  filterValidations: {
    priority: (values: unknown) => {
      const availablePriorities = Object.values(Priority);

      return [values].flat().every((value) => isIn(value, availablePriorities));
    },
    status: (values: unknown) => {
      const availableStatuses = Object.values(Status);

      return [values].flat().every((value) => isIn(value, availableStatuses));
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
