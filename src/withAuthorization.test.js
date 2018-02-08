import withAuthorization from './withAuthorization';
import { isMe, isMine } from './authResolvers';
import AuthorizationError from './errors/AuthorizationError';

const typeDefs = `
type User {
  id: String!
  name: String!
}

type Thing {
  id: String!
  foo: Int!
  user: User!
  otherThing: OtherThing
}

type OtherThing {
  id: String!
  baz: String!
  user: User!
}

type query {
  user(where: UserWhereInput): User!
  thing(where: ThingWhereInput): Thing!
  otherThing(where: OtherThingWhereInput): OtherThing!
}

type mutation {
  createUser(data: UserCreateInput): User!
}

input UserWhereInput {
  id: String
}

input ThingWhereInput {
  id: String
}

input OtherThingWhereInput {
  id: String
}

input UserCreateInput {
  name: String
}

input ThingCreateInput {
  foo: Int
}
`;

const ROLES = {
  ANONYMOUS: 'ANONYMOUS',
  USER: 'USER',
};

const authMappings = {
  [ROLES.ANONYMOUS]: {
    permissions: {
      User: {
        read: {
          id: true,
          name: true,
        },
      },
      Thing: {
        read: {
          id: true,
          foo: true,
          user: 'User',
          otherThing: 'OtherThing',
        },
      },
      OtherThing: {
        read: {
          id: true,
          baz: true,
          user: 'User',
        },
      },
    },
  },
  [ROLES.USER]: {
    inherits: ROLES.ANONYMOUS,
    permissions: {
      User: {
        read: {
          email: isMe().query,
        },
      },
      Thing: {
        read: {
          foo: true,
          bar: isMine('thing').query,
        },
      },
      OtherThing: {
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
    prisma = withAuthorization(authMappings, typeDefs, mockPrisma)(user);
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
        expect(
          prisma.query.user({ where: { id: 'userA' } }, '{ id, name, blah }'),
        ).rejects.toThrow(AuthorizationError);
      });
    });
  });
});
