'use strict';

var _roleAuthMapping = require('./roleAuthMapping');

var _roleAuthMapping2 = _interopRequireDefault(_roleAuthMapping);

function _interopRequireDefault(obj) {
  return obj && obj.__esModule ? obj : { default: obj };
}

describe('user auth mapping', function() {
  var authResolver = jest.fn();
  var authMap = {
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

  test('merges auths for inheriting roles', function() {
    expect((0, _roleAuthMapping2.default)(authMap, 'USER')).toEqual({
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
