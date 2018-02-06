import roleAuthMapping from './roleAuthMapping';

describe('user auth mapping', () => {
  const authResolver = jest.fn();
  const authMap = {
    ANONYMOUS: {
      permissions: {
        thing: {
          foo: true,
          bar: {
            fizz: true,
          },
        },
      },
    },
    FOO: {
      inherits: 'ANONYMOUS',
      permissions: {
        thing: {
          bip: true,
        },
      },
    },
    USER: {
      inherits: 'ANONYMOUS',
      permissions: {
        thing: {
          bar: {
            bop: true,
          },
          corge: authResolver,
        },
      },
    },
  };

  test('merges auths for inheriting roles', () => {
    expect(roleAuthMapping(authMap, 'USER')).toEqual({
      thing: {
        foo: true,
        bar: {
          fizz: true,
          bop: true,
        },
        corge: authResolver,
      },
    });
  });
});
