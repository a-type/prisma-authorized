import withAuthorization from './withAuthorization';
import { isMe, isMine } from './authResolvers';
import AuthorizationError from './errors/AuthorizationError';

const ROLES = {
  ANONYMOUS: 'ANONYMOUS',
  USER: 'USER',
};

const authMappings = {
  [ROLES.ANONYMOUS]: {
    permissions: {
      user: {
        read: {
          id: true,
          name: true,
          where: 'user',
        },
      },
      thing: {
        read: {
          id: true,
          foo: true,
          user: 'user',
          otherThing: 'otherThing',
          where: 'thing',
        },
      },
      otherThing: {
        read: {
          id: true,
          baz: true,
          user: 'user',
          where: 'otherThing',
        },
      },
    },
  },
  [ROLES.USER]: {
    inherits: ROLES.ANONYMOUS,
    permissions: {
      user: {
        read: {
          email: isMe().query,
        },
      },
      thing: {
        read: {
          foo: true,
          bar: isMine('thing').query,
        },
      },
      otherThing: {
        read: {
          baz: true,
          corge: isMine('otherThing').query,
        },
      },
    },
  },
};

const user = {
  id: 'userA',
  role: ROLES.USER,
};

describe('withAuthorization', () => {
  let mockPrisma, prisma;

  beforeAll(() => {
    mockPrisma = {
      query: {
        user: jest.fn(),
        thing: jest.fn(),
        otherThing: jest.fn(),
      },
      mutation: {},
      exists: jest.fn(),
      request: jest.fn(),
    };
    prisma = withAuthorization(mockPrisma, authMappings)(user);
  });

  describe('simple (bool) mappings', () => {
    describe('query (read) operations', () => {
      test('can read allowed values', async () => {
        const result = { id: 'userA', name: 'User A' };
        mockPrisma.query.user.mockReturnValueOnce(result);
        expect(
          await prisma.query.user({ where: { id: 'userA' } }, '{ id, name }'),
        ).toEqual(result);
      });
      test('cannot read unallowed values', async () => {
        const result = { id: 'userA', name: 'User A', blah: 'foo' };
        mockPrisma.query.user.mockReturnValueOnce(result);
        expect(async () => {
          await prisma.query.user(
            { where: { id: 'userA' } },
            '{ id, name, blah }',
          );
        }).toThrow(AuthorizationError);
      });
    });
  });
});
