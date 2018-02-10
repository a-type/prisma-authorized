import isMine from './isMine';

describe('isMine resolver', () => {
  describe('default config with relationship in info', () => {
    const thingQuery = jest.fn();
    const context = {
      user: { id: 'foo' },
      prisma: {
        query: {
          thing: thingQuery,
        },
      },
    };
    const check = isMine('thing');
    test('match', async () => {
      const data = { id: 'r', user: { id: 'foo' } };
      expect(await check({ typeValue: data, typeName: 'Thing', context })).toBe(
        true,
      );
      expect(thingQuery).toHaveBeenCalledTimes(0);
    });
    test('no match', async () => {
      const data = { id: 'r', user: { id: 'bar' } };
      expect(await check({ typeValue: data, typeName: 'Thing', context })).toBe(
        false,
      );
      expect(thingQuery).toHaveBeenCalledTimes(0);
    });
  });
  describe('default config with no relationship in info', () => {
    const thingQuery = jest.fn();
    const context = {
      user: { id: 'foo' },
      prisma: {
        query: {
          thing: thingQuery,
        },
      },
      typeName: 'Thing',
    };
    const data = { id: 'r1' };
    const check = isMine('thing');
    test('match', async () => {
      thingQuery.mockReturnValueOnce(Promise.resolve({ user: { id: 'foo' } }));
      expect(await check({ typeValue: data, typeName: 'Thing', context })).toBe(
        true,
      );
      expect(thingQuery).toHaveBeenCalledWith(
        { where: { id: 'r1' } },
        '{ user: { id } }',
      );
    });
    test('no match', async () => {
      thingQuery.mockReturnValueOnce(Promise.resolve({ user: { id: 'bar' } }));
      expect(await check({ typeValue: data, typeName: 'Thing', context })).toBe(
        false,
      );
      expect(thingQuery).toHaveBeenCalledWith(
        { where: { id: 'r1' } },
        '{ user: { id } }',
      );
    });
    test('no id', () => {
      expect(
        check({ typeValue: { foo: 'bar' }, typeName: 'Thing', context }),
      ).rejects.toThrow('include the id');
    });
  });
  describe('custom config', () => {
    const thingQuery = jest.fn();
    const context = {
      user: { id: 'foo' },
      prisma: {
        query: {
          thing: thingQuery,
        },
      },
    };
    const check = isMine('thing', {
      relationshipPath: 'thing.user.id',
      resourceIdPath: 'thing.id',
    });
    test('match', async () => {
      const data = { thing: { id: 'r', user: { id: 'foo' } } };
      expect(await check({ typeValue: data, typeName: 'Thing', context })).toBe(
        true,
      );
      expect(thingQuery).toHaveBeenCalledTimes(0);
    });
    test('no match', async () => {
      const data = { thing: { id: 'r', user: { id: 'bar' } } };
      expect(await check({ typeValue: data, typeName: 'Thing', context })).toBe(
        false,
      );
      expect(thingQuery).toHaveBeenCalledTimes(0);
    });
  });
});
