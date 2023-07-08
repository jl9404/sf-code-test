import {
  Op,
  Operation,
  ParsedQuery,
  ParsingConfig,
} from '@luxury-presence/nestjs-jsonapi';
import { DEFAULT_PAGE_LIMIT } from './constants';

export type PrismaFindOptions<T> = {
  where?: Partial<Record<keyof T, Record<string, any>>>;
  skip?: number;
  take?: number;
  orderBy?:
    | Partial<Record<keyof T, 'asc' | 'desc'>>
    | Record<keyof T, 'asc' | 'desc'>[];
};

const operatorMapper = {
  [Op.$eq]: 'equals',
  [Op.$in]: 'in',
  [Op.$lte]: 'lte',
  [Op.$gte]: 'gte',
};

export class ParsedQueryTransformer<T> {
  constructor(private config: ParsingConfig<T>) {}

  transform(params?: ParsedQuery<T>): PrismaFindOptions<T> {
    if (!params) {
      return {};
    }

    // only consist `path` & `url`
    if (Object.keys(params).length === 2) {
      return this.transform({
        ...params,
        sort: this.config.defaultSort,
        page: {
          on: 1,
          limit: this.config.defaultLimit || DEFAULT_PAGE_LIMIT,
        },
      });
    }

    const findOptions: PrismaFindOptions<T> = {};

    findOptions.take = params?.page?.limit || DEFAULT_PAGE_LIMIT;
    findOptions.skip = (Number(params?.page?.on || 1) - 1) * findOptions.take;

    if (params.sort) {
      findOptions.orderBy = params.sort.reduce(
        (previous, [field, direction]) => [
          ...previous,
          {
            [field]: direction.toLowerCase(),
          },
        ],
        [],
      ) as PrismaFindOptions<T>['orderBy'];
    }

    if (params.filter) {
      findOptions.where = Object.entries(params.filter).reduce<
        Partial<Record<keyof T, Record<string, any>>>
      >(
        (previous, [field, operation]) => ({
          ...previous,
          [field]: Object.entries(operation as Operation).reduce(
            (previous, [operator, value]) => {
              let newCondition;

              switch (operator) {
                case Op.$eq:
                case Op.$in:
                case Op.$lte:
                case Op.$gte:
                  if (operatorMapper[operator]) {
                    newCondition = {
                      [operatorMapper[operator]]: value,
                    };
                  }
                  break;
                case Op.$btw:
                  if (Array.isArray(value)) {
                    newCondition = {
                      gte: value[0],
                      lte: value[1],
                    };
                  }
                  break;
              }

              return {
                ...previous,
                ...newCondition,
              };
            },
            {},
          ),
        }),
        {},
      ) as PrismaFindOptions<T>['where'];
    }

    return findOptions;
  }
}
