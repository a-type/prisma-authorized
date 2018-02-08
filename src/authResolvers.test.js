import { isMe, isMine } from './authResolvers';

describe('auth resolvers', () => {
  describe('isMe', () => {
    const ctx = { user: { id: 'foo' } };

    describe('default config', () => {
      const check = isMe();
      test('match', () => {
        const result = { id: 'foo' };
        expect(check(result, ctx)).resolves.toBe(true);
      });
      test('no match', () => {
        const result = { id: 'bar' };
        expect(check(result, ctx)).resolves.toBe(false);
      });
    });
    describe('custom id path', () => {
      const check = isMe({ userIdPath: 'user.id' });
      test('match', () => {
        const result = { user: { id: 'foo' } };
        expect(check(result, ctx)).resolves.toBe(true);
      });
      test('no match', () => {
        const result = { user: { id: 'bar' } };
        expect(check(result, ctx)).resolves.toBe(false);
      });
    });
  });

  describe('isMine query', () => {
    describe('default config with relationship in info', () => {
      const thingQuery = jest.fn();
      const ctx = {
        user: { id: 'foo' },
        prisma: {
          query: {
            thing: thingQuery,
          },
        },
        typeName: 'Thing',
      };
      const check = isMine('thing');
      test('match', async () => {
        const data = { id: 'r', user: { id: 'foo' } };
        expect(await check(data, ctx)).toBe(true);
        expect(thingQuery).toHaveBeenCalledTimes(0);
      });
      test('no match', async () => {
        const data = { id: 'r', user: { id: 'bar' } };
        expect(await check(data, ctx)).toBe(false);
        expect(thingQuery).toHaveBeenCalledTimes(0);
      });
    });
    describe('default config with no relationship in info', () => {
      const thingQuery = jest.fn();
      const ctx = {
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
        thingQuery.mockReturnValueOnce(
          Promise.resolve({ user: { id: 'foo' } }),
        );
        expect(await check(data, ctx)).toBe(true);
        expect(thingQuery).toHaveBeenCalledWith(
          { where: { id: 'r1' } },
          '{ user: { id } }',
        );
      });
      test('no match', async () => {
        thingQuery.mockReturnValueOnce(
          Promise.resolve({ user: { id: 'bar' } }),
        );
        expect(await check(data, ctx)).toBe(false);
        expect(thingQuery).toHaveBeenCalledWith(
          { where: { id: 'r1' } },
          '{ user: { id } }',
        );
      });
    });
    describe('custom config', () => {
      const thingQuery = jest.fn();
      const ctx = {
        user: { id: 'foo' },
        prisma: {
          query: {
            thing: thingQuery,
          },
        },
        typeName: 'Thing',
      };
      const check = isMine('thing', {
        relationshipPath: 'thing.user.id',
        resourceIdPath: 'thing.id',
      });
      test('match', async () => {
        const data = { thing: { id: 'r', user: { id: 'foo' } } };
        expect(await check(data, ctx)).toBe(true);
        expect(thingQuery).toHaveBeenCalledTimes(0);
      });
      test('no match', async () => {
        const data = { thing: { id: 'r', user: { id: 'bar' } } };
        expect(await check(data, ctx)).toBe(false);
        expect(thingQuery).toHaveBeenCalledTimes(0);
      });
    });
  });
});
