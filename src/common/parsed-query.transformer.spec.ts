import { DEFAULT_PAGE_LIMIT } from './constants';
import { ParsedQueryTransformer } from './parsed-query.transformer';

describe('ParsedQueryTransformer', () => {
  let transformer: ParsedQueryTransformer<Dummy>;

  type Dummy = {
    id: string;
    number1: number;
    number2: number;
    number3: number;
    text: string;
    stringArray: string[];
    createdAt: Date;
  };

  const defaultProps = {
    path: 'a',
    url: 'a',
  };

  beforeEach(() => {
    transformer = new ParsedQueryTransformer<Dummy>({
      sortableColumns: ['id', 'createdAt'],
      useHas: ['stringArray'],
    });
  });

  it('should return empty object if params is undefined', () => {
    expect(transformer.transform()).toEqual({});
  });

  it('should return default order & pagination if no filter applies', () => {
    expect(transformer.transform(defaultProps)).toEqual({
      skip: 0,
      take: DEFAULT_PAGE_LIMIT,
    });
  });

  it('should handle page.on & page.limit', () => {
    expect(
      transformer.transform({
        ...defaultProps,
        page: {
          on: 2,
          limit: 50,
        },
      }),
    ).toEqual({
      skip: 50,
      take: 50,
    });
  });

  it('should handle sort', () => {
    expect(
      transformer.transform({
        ...defaultProps,
        sort: [
          ['id', 'ASC'],
          ['createdAt', 'DESC'],
        ],
      }),
    ).toEqual({
      skip: 0,
      take: 10,
      orderBy: [{ id: 'asc' }, { createdAt: 'desc' }],
    });
  });

  it('should handle filter', () => {
    expect(
      transformer.transform({
        ...defaultProps,
        filter: {
          id: {
            $eq: '123',
          },
          number1: {
            $btw: [5, 10],
          },
          number2: {
            $gte: 12,
          },
          number3: {
            $lte: 5,
          },
          text: {
            $in: ['a', 'b', 'c'],
          },
        },
      }),
    ).toEqual({
      skip: 0,
      take: 10,
      where: {
        id: {
          equals: '123',
        },
        number1: {
          gte: 5,
          lte: 10,
        },
        number2: {
          gte: 12,
        },
        number3: {
          lte: 5,
        },
        text: {
          in: ['a', 'b', 'c'],
        },
      },
    });
  });

  it('should use has* for array', () => {
    expect(
      transformer.transform({
        ...defaultProps,
        filter: {
          stringArray: {
            $in: ['a', 'b'],
          },
        },
      }),
    ).toEqual({
      skip: 0,
      take: 10,
      where: {
        stringArray: {
          hasEvery: ['a', 'b'],
        },
      },
    });
    expect(
      transformer.transform({
        ...defaultProps,
        filter: {
          stringArray: {
            $eq: 'a',
          },
        },
      }),
    ).toEqual({
      skip: 0,
      take: 10,
      where: {
        stringArray: {
          has: 'a',
        },
      },
    });
  });
});
