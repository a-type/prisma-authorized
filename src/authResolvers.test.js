import { toFragment, isMe, isMine } from './authResolvers';

describe('auth resolvers', () => {
  describe('toFragment', () => {
    test('single name', () => {
      expect(toFragment('foo')).toEqual('{ foo }');
    });
    test('nested name', () => {
      expect(toFragment('foo.bar')).toEqual('{ foo: { bar } }');
    });
  });

  describe('isMe mutation', () => {
    const ctx = { user: { id: 'foo' } };

    describe('default config', () => {
      const check = isMe().mutation;
      test('match', () => {
        const query = { data: { id: 'foo' } };
        expect(check(query, null, ctx)).resolves.toBe(true);
      });
      test('no match', () => {
        const query = { data: { id: 'bar' } };
        expect(check(query, null, ctx)).resolves.toBe(false);
      });
    });
    describe('custom id path', () => {
      const check = isMe({ userIdPath: 'user.connect.where.id' }).mutation;
      test('match', () => {
        const query = {
          data: { foo: 'bar', user: { connect: { where: { id: 'foo' } } } },
        };
        expect(check(query, null, ctx)).resolves.toBe(true);
      });
      test('no match', () => {
        const query = {
          data: { foo: 'bar', user: { connect: { where: { id: 'bar' } } } },
        };
        expect(check(query, null, ctx)).resolves.toBe(false);
      });
    });
  });

  describe('isMe query', () => {
    const ctx = { user: { id: 'foo' } };

    describe('default config', () => {
      const check = isMe().query;
      test('match', () => {
        const result = { id: 'foo' };
        expect(check(null, () => Promise.resolve(result), ctx)).resolves.toBe(
          true,
        );
      });
      test('no match', () => {
        const result = { id: 'bar' };
        expect(check(null, () => Promise.resolve(result), ctx)).resolves.toBe(
          false,
        );
      });
    });
    describe('custom id path', () => {
      const check = isMe({ userIdPath: 'user.id' }).query;
      test('match', () => {
        const result = { user: { id: 'foo' } };
        expect(check(null, () => Promise.resolve(result), ctx)).resolves.toBe(
          true,
        );
      });
      test('no match', () => {
        const result = { user: { id: 'bar' } };
        expect(check(null, () => Promise.resolve(result), ctx)).resolves.toBe(
          false,
        );
      });
    });
  });

  describe('isMine mutation', () => {
    describe('default config', () => {
      const thingQuery = jest.fn();
      const ctx = {
        user: { id: 'foo' },
        prisma: {
          query: {
            thing: thingQuery,
          },
        },
      };
      const query = { data: { id: 'r' } };
      const check = isMine('thing').mutation;
      test('match', async () => {
        thingQuery.mockReturnValueOnce(
          Promise.resolve({ user: { id: 'foo' } }),
        );
        expect(await check(query, null, ctx)).toBe(true);
        expect(thingQuery).toHaveBeenCalledWith(
          { where: { id: 'r' } },
          '{ user: { id } }',
        );
      });
      test('no match', async () => {
        thingQuery.mockReturnValueOnce(
          Promise.resolve({ user: { id: 'bar' } }),
        );
        expect(await check(query, null, ctx)).toBe(false);
        expect(thingQuery).toHaveBeenCalledWith(
          { where: { id: 'r' } },
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
      };
      const query = { data: { thing: { connect: { where: { id: 'r' } } } } };
      const check = isMine('thing', {
        relationshipPath: 'owner.id',
        resourceIdPath: 'thing.connect.where.id',
      }).mutation;
      test('match', async () => {
        thingQuery.mockReturnValueOnce(
          Promise.resolve({ owner: { id: 'foo' } }),
        );
        expect(await check(query, null, ctx)).toBe(true);
        expect(thingQuery).toHaveBeenCalledWith(
          { where: { id: 'r' } },
          '{ owner: { id } }',
        );
      });
      test('no match', async () => {
        thingQuery.mockReturnValueOnce(
          Promise.resolve({ owner: { id: 'bar' } }),
        );
        expect(await check(query, null, ctx)).toBe(false);
        expect(thingQuery).toHaveBeenCalledWith(
          { where: { id: 'r' } },
          '{ owner: { id } }',
        );
      });
    });
  });

  describe('isMine query', () => {
    describe('default config with relationship in info', () => {
      const thingQuery = jest.fn();
      const query = { data: { id: 'r' } };
      const ctx = {
        user: { id: 'foo' },
        prisma: {
          query: {
            thing: thingQuery,
          },
        },
      };
      const check = isMine('thing').query;
      test('match', async () => {
        const run = () => Promise.resolve({ id: 'r', user: { id: 'foo' } });
        expect(await check(query, run, ctx)).toBe(true);
        expect(thingQuery).toHaveBeenCalledTimes(0);
      });
      test('no match', async () => {
        const run = () => Promise.resolve({ id: 'r', user: { id: 'bar' } });
        expect(await check(query, run, ctx)).toBe(false);
        expect(thingQuery).toHaveBeenCalledTimes(0);
      });
    });
    describe('default config with no relationship in info', () => {
      const thingQuery = jest.fn();
      const query = { data: { id: 'r1' } };
      const ctx = {
        user: { id: 'foo' },
        prisma: {
          query: {
            thing: thingQuery,
          },
        },
      };
      const check = isMine('thing').query;
      const run = () => Promise.resolve({ id: 'r1' });
      test('match', async () => {
        thingQuery.mockReturnValueOnce(
          Promise.resolve({ user: { id: 'foo' } }),
        );
        expect(await check(query, run, ctx)).toBe(true);
        expect(thingQuery).toHaveBeenCalledWith(
          { where: { id: 'r1' } },
          '{ user: { id } }',
        );
      });
      test('no match', async () => {
        thingQuery.mockReturnValueOnce(
          Promise.resolve({ user: { id: 'bar' } }),
        );
        expect(await check(query, run, ctx)).toBe(false);
        expect(thingQuery).toHaveBeenCalledWith(
          { where: { id: 'r1' } },
          '{ user: { id } }',
        );
      });
    });
    describe('custom config', () => {
      const thingQuery = jest.fn();
      const query = { data: { id: 'r' } };
      const ctx = {
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
      }).query;
      test('match', async () => {
        const run = () =>
          Promise.resolve({ thing: { id: 'r', user: { id: 'foo' } } });
        expect(await check(query, run, ctx)).toBe(true);
        expect(thingQuery).toHaveBeenCalledTimes(0);
      });
      test('no match', async () => {
        const run = () =>
          Promise.resolve({ thing: { id: 'r', user: { id: 'bar' } } });
        expect(await check(query, run, ctx)).toBe(false);
        expect(thingQuery).toHaveBeenCalledTimes(0);
      });
    });
  });
});
