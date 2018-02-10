import withAuthorization from './withAuthorization';
import { isMe, isMine } from './resolvers';
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
  users: [User!]!
  thing(where: ThingWhereInput): Thing!
  otherThing(where: OtherThingWhereInput): OtherThing!
}

type mutation {
  createUser(data: UserCreateInput): User!
  updateUser(where: UserWhereInput, data: UserUpdateInput): User!
  createThing(data: ThingCreateInput): Thing!
  createOtherThing(data: OtherThingCreateInput): OtherThing!
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

input UserUpdateInput {
  name: String
}

input ThingCreateInput {
  foo: Int
}

input OtherThingCreateInput {
  baz: String
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
        write: {},
      },
      Thing: {
        read: {
          id: true,
          foo: true,
          user: 'User',
          otherThing: 'OtherThing',
        },
        write: {},
      },
      OtherThing: {
        read: {
          id: true,
          baz: true,
          user: 'User',
        },
        write: {},
      },
    },
  },
  [ROLES.USER]: {
    inherits: ROLES.ANONYMOUS,
    permissions: {
      User: {
        read: {
          email: isMe(),
          a: true,
        },
        write: {
          name: isMe(),
        },
      },
      UserCreateInput: { write: 'User' },
      UserUpdateInput: { write: 'User' },
      UserWhereInput: { write: { id: true } },

      Thing: {
        read: {
          foo: true,
          bar: isMine('thing'),
        },
        write: {
          foo: true,
        },
      },
      ThingCreateInput: { write: 'Thing' },

      OtherThing: {
        read: {
          baz: true,
          corge: isMine('otherThing'),
        },
        write: {
          baz: isMine('OtherThing'),
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
        users: jest.fn(),
        thing: jest.fn(),
        otherThing: jest.fn(),
      },
      mutation: {
        createUser: jest.fn(),
        updateUser: jest.fn(),
        createThing: jest.fn(),
        createOtherThing: jest.fn(),
      },
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
      test('can read list value types', async () => {
        const result = [
          { id: 'userA', name: 'User A' },
          { id: 'userB', name: 'User B' },
        ];
        mockPrisma.query.users.mockReturnValueOnce(result);
        expect(await prisma.query.users({}, '{ id, name }')).toEqual(result);
      });
      test('cannot read unallowed values', async () => {
        const result = { id: 'userA', name: 'User A', blah: 'foo' };
        mockPrisma.query.user.mockReturnValueOnce(result);
        expect(
          prisma.query.user({ where: { id: 'userA' } }, '{ id, name, blah }'),
        ).rejects.toThrow('{"id":true,"name":true,"blah":false}');
      });
    });

    describe('mutation (write) operations', () => {
      test('can write allowed values', async () => {
        const result = { id: 'thingA', foo: 'a' };
        const input = { data: { foo: 'a' } };
        mockPrisma.mutation.createThing.mockReturnValueOnce(result);
        expect(await prisma.mutation.createThing(input, '{ id, foo }')).toEqual(
          result,
        );
      });

      test('cannot write unallowed values', async () => {
        const input = { data: { id: 'userB' } };
        expect(prisma.mutation.createUser(input, '{ id }')).rejects.toThrow(
          '{"id":false}',
        );
      });
    });
  });

  describe('function mappings', () => {
    describe('read operations', () => {
      test('can read allowed values', async () => {
        const result = { id: 'userA', name: 'User A', email: 'user@place.com' };
        mockPrisma.query.user.mockReturnValueOnce(result);
        expect(
          await prisma.query.user(
            { where: { id: 'userA' } },
            '{ id, name, email }',
          ),
        ).toEqual(result);
      });

      test('cannot read unallowed values', async () => {
        const result = { id: 'userB', name: 'User B', email: 'user@place.com' };
        mockPrisma.query.user.mockReturnValueOnce(result);
        expect(
          prisma.query.user({ where: { id: 'userB' } }, '{ id, name, email }'),
        ).rejects.toThrow('"email":false');
      });
    });

    describe('write operations', () => {
      test('can write allowed values', async () => {
        const result = {
          id: 'userA',
          name: 'User AA',
          email: 'user@place.com',
        };
        const input = { data: { name: 'User AA' }, where: { id: 'userA' } };
        mockPrisma.mutation.updateUser.mockReturnValueOnce(result);
        expect(
          await prisma.mutation.updateUser(input, '{ id, name, email }'),
        ).toEqual(result);
      });
    });
  });
});
