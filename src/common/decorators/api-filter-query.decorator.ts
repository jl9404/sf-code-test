import { Op, ParsingConfig } from '@luxury-presence/nestjs-jsonapi';
import { applyDecorators } from '@nestjs/common';
import { ApiQuery } from '@nestjs/swagger';

export function ApiFilterQuery<T>(config: ParsingConfig<T>) {
  const hasSortable = config?.sortableColumns?.length > 0;

  return applyDecorators(
    ...Object.entries(config?.filterableColumns || {}).map(
      ([field, operators]: [string, Op[]]) =>
        ApiQuery({
          name: `filter.${field}`,
          required: false,
          description: `available operators: \`${operators.join('`, `')}\``,
          examples: {
            empty: {
              summary: ' ',
              value: '',
            },
            $eq: {
              summary: 'Equal Filter',
              value: '$eq:value',
            },
            $btw: {
              summary: 'Between Filter',
              value: '$btw:value1,value2',
            },
            $in: {
              summary: 'In Filter',
              value: '$in:value1,value2',
            },
          },
        }),
    ),
    ...(hasSortable
      ? [
          ApiQuery({
            name: 'sort',
            type: 'string',
            required: false,
            description: `available fields: \`${config.sortableColumns.join(
              '`, `',
            )}\``,
            examples: {
              empty: {
                summary: ' ',
                value: '',
              },
              singleAsc: {
                summary: 'Single Field Sorting (Asc)',
                value: 'name',
              },
              singleDesc: {
                summary: 'Single Field Sorting (Desc)',
                value: '-createdAt',
              },
              combined: {
                summary: 'Combined Fields Sorting',
                value: '-createdAt,name',
              },
            },
          }),
        ]
      : []),
    ApiQuery({
      name: 'page.on',
      required: false,
      type: 'number',
      example: '1',
    }),
    ApiQuery({
      name: 'page.limit',
      required: false,
      type: 'number',
      example: '10',
    }),
  );
}
