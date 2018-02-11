import rolePermissions from './rolePermissions';
import { isMe } from '../resolvers';

describe('user auth mapping', () => {
  const authResolver = isMe();
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
            email: false,
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
            email: authResolver,
          },
          write: {
            name: authResolver,
          },
        },
      },
    },
  };

  test('merges auths for inheriting roles', () => {
    const result = rolePermissions(authMappings, 'USER');
    expect(result).toEqual({
      User: {
        read: {
          id: true,
          name: true,
          email: authResolver,
        },
        write: {
          name: authResolver,
        },
      },
    });
  });

  test('handles no role', () => {
    const result = rolePermissions(authMappings);
    expect(result).toEqual({});
  });
});
