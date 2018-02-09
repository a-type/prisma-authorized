import roleAuthMapping from './roleAuthMapping';
import { isMe } from './authResolvers';

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
    const result = roleAuthMapping(authMappings, 'USER');
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
});
