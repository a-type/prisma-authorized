'use strict';

var _authResolvers = require('./authResolvers');

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

describe('auth resolvers', function() {
  describe('toFragment', function() {
    test('single name', function() {
      expect((0, _authResolvers.toFragment)('foo')).toEqual('{ foo }');
    });
    test('nested name', function() {
      expect((0, _authResolvers.toFragment)('foo.bar')).toEqual(
        '{ foo: { bar } }',
      );
    });
  });

  describe('isMe mutation', function() {
    var ctx = { user: { id: 'foo' } };

    describe('default config', function() {
      var check = (0, _authResolvers.isMe)().mutation;
      test('match', function() {
        var query = { data: { id: 'foo' } };
        expect(check(query, null, ctx)).resolves.toBe(true);
      });
      test('no match', function() {
        var query = { data: { id: 'bar' } };
        expect(check(query, null, ctx)).resolves.toBe(false);
      });
    });
    describe('custom id path', function() {
      var check = (0, _authResolvers.isMe)({
        userIdPath: 'user.connect.where.id',
      }).mutation;
      test('match', function() {
        var query = {
          data: { foo: 'bar', user: { connect: { where: { id: 'foo' } } } },
        };
        expect(check(query, null, ctx)).resolves.toBe(true);
      });
      test('no match', function() {
        var query = {
          data: { foo: 'bar', user: { connect: { where: { id: 'bar' } } } },
        };
        expect(check(query, null, ctx)).resolves.toBe(false);
      });
    });
  });

  describe('isMe query', function() {
    var ctx = { user: { id: 'foo' } };

    describe('default config', function() {
      var check = (0, _authResolvers.isMe)().query;
      test('match', function() {
        var result = { id: 'foo' };
        expect(
          check(
            null,
            function() {
              return Promise.resolve(result);
            },
            ctx,
          ),
        ).resolves.toBe(true);
      });
      test('no match', function() {
        var result = { id: 'bar' };
        expect(
          check(
            null,
            function() {
              return Promise.resolve(result);
            },
            ctx,
          ),
        ).resolves.toBe(false);
      });
    });
    describe('custom id path', function() {
      var check = (0, _authResolvers.isMe)({ userIdPath: 'user.id' }).query;
      test('match', function() {
        var result = { user: { id: 'foo' } };
        expect(
          check(
            null,
            function() {
              return Promise.resolve(result);
            },
            ctx,
          ),
        ).resolves.toBe(true);
      });
      test('no match', function() {
        var result = { user: { id: 'bar' } };
        expect(
          check(
            null,
            function() {
              return Promise.resolve(result);
            },
            ctx,
          ),
        ).resolves.toBe(false);
      });
    });
  });

  describe('isMine mutation', function() {
    describe('default config', function() {
      var thingQuery = jest.fn();
      var ctx = {
        user: { id: 'foo' },
        prisma: {
          query: {
            thing: thingQuery,
          },
        },
      };
      var query = { data: { id: 'r' } };
      var check = (0, _authResolvers.isMine)('thing').mutation;
      test(
        'match',
        _asyncToGenerator(
          /*#__PURE__*/ regeneratorRuntime.mark(function _callee() {
            return regeneratorRuntime.wrap(
              function _callee$(_context) {
                while (1) {
                  switch ((_context.prev = _context.next)) {
                    case 0:
                      thingQuery.mockReturnValueOnce(
                        Promise.resolve({ user: { id: 'foo' } }),
                      );
                      _context.t0 = expect;
                      _context.next = 4;
                      return check(query, null, ctx);

                    case 4:
                      _context.t1 = _context.sent;
                      (0, _context.t0)(_context.t1).toBe(true);

                      expect(thingQuery).toHaveBeenCalledWith(
                        { where: { id: 'r' } },
                        '{ user: { id } }',
                      );

                    case 7:
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
        'no match',
        _asyncToGenerator(
          /*#__PURE__*/ regeneratorRuntime.mark(function _callee2() {
            return regeneratorRuntime.wrap(
              function _callee2$(_context2) {
                while (1) {
                  switch ((_context2.prev = _context2.next)) {
                    case 0:
                      thingQuery.mockReturnValueOnce(
                        Promise.resolve({ user: { id: 'bar' } }),
                      );
                      _context2.t0 = expect;
                      _context2.next = 4;
                      return check(query, null, ctx);

                    case 4:
                      _context2.t1 = _context2.sent;
                      (0, _context2.t0)(_context2.t1).toBe(false);

                      expect(thingQuery).toHaveBeenCalledWith(
                        { where: { id: 'r' } },
                        '{ user: { id } }',
                      );

                    case 7:
                    case 'end':
                      return _context2.stop();
                  }
                }
              },
              _callee2,
              undefined,
            );
          }),
        ),
      );
    });
    describe('custom config', function() {
      var thingQuery = jest.fn();
      var ctx = {
        user: { id: 'foo' },
        prisma: {
          query: {
            thing: thingQuery,
          },
        },
      };
      var query = { data: { thing: { connect: { where: { id: 'r' } } } } };
      var check = (0, _authResolvers.isMine)('thing', {
        relationshipPath: 'owner.id',
        resourceIdPath: 'thing.connect.where.id',
      }).mutation;
      test(
        'match',
        _asyncToGenerator(
          /*#__PURE__*/ regeneratorRuntime.mark(function _callee3() {
            return regeneratorRuntime.wrap(
              function _callee3$(_context3) {
                while (1) {
                  switch ((_context3.prev = _context3.next)) {
                    case 0:
                      thingQuery.mockReturnValueOnce(
                        Promise.resolve({ owner: { id: 'foo' } }),
                      );
                      _context3.t0 = expect;
                      _context3.next = 4;
                      return check(query, null, ctx);

                    case 4:
                      _context3.t1 = _context3.sent;
                      (0, _context3.t0)(_context3.t1).toBe(true);

                      expect(thingQuery).toHaveBeenCalledWith(
                        { where: { id: 'r' } },
                        '{ owner: { id } }',
                      );

                    case 7:
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
      test(
        'no match',
        _asyncToGenerator(
          /*#__PURE__*/ regeneratorRuntime.mark(function _callee4() {
            return regeneratorRuntime.wrap(
              function _callee4$(_context4) {
                while (1) {
                  switch ((_context4.prev = _context4.next)) {
                    case 0:
                      thingQuery.mockReturnValueOnce(
                        Promise.resolve({ owner: { id: 'bar' } }),
                      );
                      _context4.t0 = expect;
                      _context4.next = 4;
                      return check(query, null, ctx);

                    case 4:
                      _context4.t1 = _context4.sent;
                      (0, _context4.t0)(_context4.t1).toBe(false);

                      expect(thingQuery).toHaveBeenCalledWith(
                        { where: { id: 'r' } },
                        '{ owner: { id } }',
                      );

                    case 7:
                    case 'end':
                      return _context4.stop();
                  }
                }
              },
              _callee4,
              undefined,
            );
          }),
        ),
      );
    });
  });

  describe('isMine query', function() {
    describe('default config with relationship in info', function() {
      var thingQuery = jest.fn();
      var query = { data: { id: 'r' } };
      var ctx = {
        user: { id: 'foo' },
        prisma: {
          query: {
            thing: thingQuery,
          },
        },
      };
      var check = (0, _authResolvers.isMine)('thing').query;
      test(
        'match',
        _asyncToGenerator(
          /*#__PURE__*/ regeneratorRuntime.mark(function _callee5() {
            var run;
            return regeneratorRuntime.wrap(
              function _callee5$(_context5) {
                while (1) {
                  switch ((_context5.prev = _context5.next)) {
                    case 0:
                      run = function run() {
                        return Promise.resolve({
                          id: 'r',
                          user: { id: 'foo' },
                        });
                      };

                      _context5.t0 = expect;
                      _context5.next = 4;
                      return check(query, run, ctx);

                    case 4:
                      _context5.t1 = _context5.sent;
                      (0, _context5.t0)(_context5.t1).toBe(true);

                      expect(thingQuery).toHaveBeenCalledTimes(0);

                    case 7:
                    case 'end':
                      return _context5.stop();
                  }
                }
              },
              _callee5,
              undefined,
            );
          }),
        ),
      );
      test(
        'no match',
        _asyncToGenerator(
          /*#__PURE__*/ regeneratorRuntime.mark(function _callee6() {
            var run;
            return regeneratorRuntime.wrap(
              function _callee6$(_context6) {
                while (1) {
                  switch ((_context6.prev = _context6.next)) {
                    case 0:
                      run = function run() {
                        return Promise.resolve({
                          id: 'r',
                          user: { id: 'bar' },
                        });
                      };

                      _context6.t0 = expect;
                      _context6.next = 4;
                      return check(query, run, ctx);

                    case 4:
                      _context6.t1 = _context6.sent;
                      (0, _context6.t0)(_context6.t1).toBe(false);

                      expect(thingQuery).toHaveBeenCalledTimes(0);

                    case 7:
                    case 'end':
                      return _context6.stop();
                  }
                }
              },
              _callee6,
              undefined,
            );
          }),
        ),
      );
    });
    describe('default config with no relationship in info', function() {
      var thingQuery = jest.fn();
      var query = { data: { id: 'r1' } };
      var ctx = {
        user: { id: 'foo' },
        prisma: {
          query: {
            thing: thingQuery,
          },
        },
      };
      var check = (0, _authResolvers.isMine)('thing').query;
      var run = function run() {
        return Promise.resolve({ id: 'r1' });
      };
      test(
        'match',
        _asyncToGenerator(
          /*#__PURE__*/ regeneratorRuntime.mark(function _callee7() {
            return regeneratorRuntime.wrap(
              function _callee7$(_context7) {
                while (1) {
                  switch ((_context7.prev = _context7.next)) {
                    case 0:
                      thingQuery.mockReturnValueOnce(
                        Promise.resolve({ user: { id: 'foo' } }),
                      );
                      _context7.t0 = expect;
                      _context7.next = 4;
                      return check(query, run, ctx);

                    case 4:
                      _context7.t1 = _context7.sent;
                      (0, _context7.t0)(_context7.t1).toBe(true);

                      expect(thingQuery).toHaveBeenCalledWith(
                        { where: { id: 'r1' } },
                        '{ user: { id } }',
                      );

                    case 7:
                    case 'end':
                      return _context7.stop();
                  }
                }
              },
              _callee7,
              undefined,
            );
          }),
        ),
      );
      test(
        'no match',
        _asyncToGenerator(
          /*#__PURE__*/ regeneratorRuntime.mark(function _callee8() {
            return regeneratorRuntime.wrap(
              function _callee8$(_context8) {
                while (1) {
                  switch ((_context8.prev = _context8.next)) {
                    case 0:
                      thingQuery.mockReturnValueOnce(
                        Promise.resolve({ user: { id: 'bar' } }),
                      );
                      _context8.t0 = expect;
                      _context8.next = 4;
                      return check(query, run, ctx);

                    case 4:
                      _context8.t1 = _context8.sent;
                      (0, _context8.t0)(_context8.t1).toBe(false);

                      expect(thingQuery).toHaveBeenCalledWith(
                        { where: { id: 'r1' } },
                        '{ user: { id } }',
                      );

                    case 7:
                    case 'end':
                      return _context8.stop();
                  }
                }
              },
              _callee8,
              undefined,
            );
          }),
        ),
      );
    });
    describe('custom config', function() {
      var thingQuery = jest.fn();
      var query = { data: { id: 'r' } };
      var ctx = {
        user: { id: 'foo' },
        prisma: {
          query: {
            thing: thingQuery,
          },
        },
      };
      var check = (0, _authResolvers.isMine)('thing', {
        relationshipPath: 'thing.user.id',
        resourceIdPath: 'thing.id',
      }).query;
      test(
        'match',
        _asyncToGenerator(
          /*#__PURE__*/ regeneratorRuntime.mark(function _callee9() {
            var run;
            return regeneratorRuntime.wrap(
              function _callee9$(_context9) {
                while (1) {
                  switch ((_context9.prev = _context9.next)) {
                    case 0:
                      run = function run() {
                        return Promise.resolve({
                          thing: { id: 'r', user: { id: 'foo' } },
                        });
                      };

                      _context9.t0 = expect;
                      _context9.next = 4;
                      return check(query, run, ctx);

                    case 4:
                      _context9.t1 = _context9.sent;
                      (0, _context9.t0)(_context9.t1).toBe(true);

                      expect(thingQuery).toHaveBeenCalledTimes(0);

                    case 7:
                    case 'end':
                      return _context9.stop();
                  }
                }
              },
              _callee9,
              undefined,
            );
          }),
        ),
      );
      test(
        'no match',
        _asyncToGenerator(
          /*#__PURE__*/ regeneratorRuntime.mark(function _callee10() {
            var run;
            return regeneratorRuntime.wrap(
              function _callee10$(_context10) {
                while (1) {
                  switch ((_context10.prev = _context10.next)) {
                    case 0:
                      run = function run() {
                        return Promise.resolve({
                          thing: { id: 'r', user: { id: 'bar' } },
                        });
                      };

                      _context10.t0 = expect;
                      _context10.next = 4;
                      return check(query, run, ctx);

                    case 4:
                      _context10.t1 = _context10.sent;
                      (0, _context10.t0)(_context10.t1).toBe(false);

                      expect(thingQuery).toHaveBeenCalledTimes(0);

                    case 7:
                    case 'end':
                      return _context10.stop();
                  }
                }
              },
              _callee10,
              undefined,
            );
          }),
        ),
      );
    });
  });
});
