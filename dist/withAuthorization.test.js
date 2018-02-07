'use strict';

var _authMappings;

var _withAuthorization = require('./withAuthorization');

var _withAuthorization2 = _interopRequireDefault(_withAuthorization);

var _authResolvers = require('./authResolvers');

var _AuthorizationError = require('./errors/AuthorizationError');

var _AuthorizationError2 = _interopRequireDefault(_AuthorizationError);

function _interopRequireDefault(obj) {
  return obj && obj.__esModule ? obj : { default: obj };
}

function _asyncToGenerator(fn) {
  return function() {
    var gen = fn.apply(this, arguments);
    return new Promise(function(resolve, reject) {
      function step(key, arg) {
        try {
          var info = gen[key](arg);
          var value = info.value;
        } catch (error) {
          reject(error);
          return;
        }
        if (info.done) {
          resolve(value);
        } else {
          return Promise.resolve(value).then(
            function(value) {
              step('next', value);
            },
            function(err) {
              step('throw', err);
            },
          );
        }
      }
      return step('next');
    });
  };
}

function _defineProperty(obj, key, value) {
  if (key in obj) {
    Object.defineProperty(obj, key, {
      value: value,
      enumerable: true,
      configurable: true,
      writable: true,
    });
  } else {
    obj[key] = value;
  }
  return obj;
}

var typeDefs =
  '\ntype User {\n  id: String!\n  name: String!\n}\n\ntype Thing {\n  id: String!\n  foo: Int!\n  user: User!\n  otherThing: OtherThing\n}\n\ntype OtherThing {\n  id: String!\n  baz: String!\n  user: User!\n}\n\ntype query {\n  user(where: UserUniqueInput): User!\n  thing(where: ThingUniqueInput): Thing!\n  otherThing(where: OtherThingUniqueInput): OtherThing!\n}\n';

var ROLES = {
  ANONYMOUS: 'ANONYMOUS',
  USER: 'USER',
};

var authMappings = ((_authMappings = {}),
_defineProperty(_authMappings, ROLES.ANONYMOUS, {
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
}),
_defineProperty(_authMappings, ROLES.USER, {
  inherits: ROLES.ANONYMOUS,
  permissions: {
    User: {
      read: {
        email: (0, _authResolvers.isMe)().query,
      },
    },
    Thing: {
      read: {
        foo: true,
        bar: (0, _authResolvers.isMine)('thing').query,
      },
    },
    OtherThing: {
      read: {
        baz: true,
        corge: (0, _authResolvers.isMine)('otherThing').query,
      },
    },
  },
}),
_authMappings);

var user = {
  id: 'userA',
  role: ROLES.USER,
};

describe('withAuthorization', function() {
  var mockPrisma = void 0,
    prisma = void 0;

  beforeAll(function() {
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
    prisma = (0, _withAuthorization2.default)(authMappings, typeDefs)(user);
  });

  describe('simple (bool) mappings', function() {
    describe('query (read) operations', function() {
      test(
        'can read allowed values',
        _asyncToGenerator(
          /*#__PURE__*/ regeneratorRuntime.mark(function _callee() {
            var result;
            return regeneratorRuntime.wrap(
              function _callee$(_context) {
                while (1) {
                  switch ((_context.prev = _context.next)) {
                    case 0:
                      result = { id: 'userA', name: 'User A' };

                      mockPrisma.query.user.mockReturnValueOnce(result);
                      _context.t0 = expect;
                      _context.next = 5;
                      return prisma.query.user(
                        { where: { id: 'userA' } },
                        '{ id, name }',
                      );

                    case 5:
                      _context.t1 = _context.sent;
                      _context.t2 = result;
                      (0, _context.t0)(_context.t1).toEqual(_context.t2);

                    case 8:
                    case 'end':
                      return _context.stop();
                  }
                }
              },
              _callee,
              undefined,
            );
          }),
        ),
      );
      test(
        'cannot read unallowed values',
        _asyncToGenerator(
          /*#__PURE__*/ regeneratorRuntime.mark(function _callee3() {
            var result;
            return regeneratorRuntime.wrap(
              function _callee3$(_context3) {
                while (1) {
                  switch ((_context3.prev = _context3.next)) {
                    case 0:
                      result = { id: 'userA', name: 'User A', blah: 'foo' };

                      mockPrisma.query.user.mockReturnValueOnce(result);
                      expect(
                        _asyncToGenerator(
                          /*#__PURE__*/ regeneratorRuntime.mark(
                            function _callee2() {
                              return regeneratorRuntime.wrap(
                                function _callee2$(_context2) {
                                  while (1) {
                                    switch ((_context2.prev = _context2.next)) {
                                      case 0:
                                        _context2.next = 2;
                                        return prisma.query.user(
                                          { where: { id: 'userA' } },
                                          '{ id, name, blah }',
                                        );

                                      case 2:
                                      case 'end':
                                        return _context2.stop();
                                    }
                                  }
                                },
                                _callee2,
                                undefined,
                              );
                            },
                          ),
                        ),
                      ).toThrow(_AuthorizationError2.default);

                    case 3:
                    case 'end':
                      return _context3.stop();
                  }
                }
              },
              _callee3,
              undefined,
            );
          }),
        ),
      );
    });
  });
});
