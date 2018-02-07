'use strict';

Object.defineProperty(exports, '__esModule', {
  value: true,
});
exports.isMine = exports.isMe = exports.toFragment = undefined;

var _lodash = require('lodash');

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

var toFragment = (exports.toFragment = function toFragment(path) {
  var parts = path.split('.');
  if (parts[0]) {
    if (parts[1]) {
      return '{ ' + parts[0] + ': ' + toFragment(parts[1]) + ' }';
    } else {
      return '{ ' + parts[0] + ' }';
    }
  }
  {
    return '';
  }
});

var isMe = (exports.isMe = function isMe() {
  var options =
    arguments.length > 0 && arguments[0] !== undefined
      ? arguments[0]
      : { userIdPath: 'id' };
  var _options$userIdPath = options.userIdPath,
    userIdPath = _options$userIdPath === undefined ? 'id' : _options$userIdPath;

  return {
    mutation: (function() {
      var _ref2 = _asyncToGenerator(
        /*#__PURE__*/ regeneratorRuntime.mark(function _callee(
          query,
          run,
          _ref,
        ) {
          var user = _ref.user;
          var id;
          return regeneratorRuntime.wrap(
            function _callee$(_context) {
              while (1) {
                switch ((_context.prev = _context.next)) {
                  case 0:
                    id = (0, _lodash.get)(query, 'data.' + userIdPath);
                    return _context.abrupt('return', id === user.id);

                  case 2:
                  case 'end':
                    return _context.stop();
                }
              }
            },
            _callee,
            undefined,
          );
        }),
      );

      function mutation(_x2, _x3, _x4) {
        return _ref2.apply(this, arguments);
      }

      return mutation;
    })(),

    query: (function() {
      var _ref4 = _asyncToGenerator(
        /*#__PURE__*/ regeneratorRuntime.mark(function _callee2(
          _query,
          run,
          _ref3,
        ) {
          var user = _ref3.user;
          var resource, id;
          return regeneratorRuntime.wrap(
            function _callee2$(_context2) {
              while (1) {
                switch ((_context2.prev = _context2.next)) {
                  case 0:
                    _context2.next = 2;
                    return run();

                  case 2:
                    resource = _context2.sent;
                    id = (0, _lodash.get)(resource, userIdPath);
                    return _context2.abrupt('return', id === user.id);

                  case 5:
                  case 'end':
                    return _context2.stop();
                }
              }
            },
            _callee2,
            undefined,
          );
        }),
      );

      function query(_x5, _x6, _x7) {
        return _ref4.apply(this, arguments);
      }

      return query;
    })(),
  };
});

var isMine = (exports.isMine = function isMine(getFieldName) {
  var options =
    arguments.length > 1 && arguments[1] !== undefined
      ? arguments[1]
      : {
          relationshipPath: 'user.id',
          resourceIdPath: 'id',
        };
  var _options$relationship = options.relationshipPath,
    relationshipPath =
      _options$relationship === undefined ? 'user.id' : _options$relationship,
    _options$resourceIdPa = options.resourceIdPath,
    resourceIdPath =
      _options$resourceIdPa === undefined ? 'id' : _options$resourceIdPa;

  var mutation = (function() {
    var _ref6 = _asyncToGenerator(
      /*#__PURE__*/ regeneratorRuntime.mark(function _callee3(
        query,
        run,
        _ref5,
      ) {
        var prisma = _ref5.prisma,
          user = _ref5.user;
        var id, info, relationshipResponse;
        return regeneratorRuntime.wrap(
          function _callee3$(_context3) {
            while (1) {
              switch ((_context3.prev = _context3.next)) {
                case 0:
                  id = (0, _lodash.get)(query, 'data.' + resourceIdPath);

                  if (id) {
                    _context3.next = 3;
                    break;
                  }

                  throw new Error(
                    'In order for this authorization check to work, you must include the id' +
                      ' for the resource in your query. If that is not possible, please opt to use' +
                      ' a custom authorization check for this permission.',
                  );

                case 3:
                  info = toFragment(relationshipPath);
                  _context3.next = 6;
                  return prisma.query[getFieldName](
                    { where: { id: id } },
                    info,
                  );

                case 6:
                  relationshipResponse = _context3.sent;
                  return _context3.abrupt(
                    'return',
                    (0, _lodash.get)(relationshipResponse, relationshipPath) ===
                      user.id,
                  );

                case 8:
                case 'end':
                  return _context3.stop();
              }
            }
          },
          _callee3,
          undefined,
        );
      }),
    );

    return function mutation(_x9, _x10, _x11) {
      return _ref6.apply(this, arguments);
    };
  })();

  return {
    query: (function() {
      var _ref7 = _asyncToGenerator(
        /*#__PURE__*/ regeneratorRuntime.mark(function _callee4(
          _query2,
          run,
          ctx,
        ) {
          var resource, userId;
          return regeneratorRuntime.wrap(
            function _callee4$(_context4) {
              while (1) {
                switch ((_context4.prev = _context4.next)) {
                  case 0:
                    _context4.next = 2;
                    return run();

                  case 2:
                    resource = _context4.sent;
                    userId = (0, _lodash.get)(resource, relationshipPath);

                    if (!userId) {
                      _context4.next = 6;
                      break;
                    }

                    return _context4.abrupt('return', userId === ctx.user.id);

                  case 6:
                    return _context4.abrupt(
                      'return',
                      mutation({ data: resource }, run, ctx),
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
      );

      function query(_x12, _x13, _x14) {
        return _ref7.apply(this, arguments);
      }

      return query;
    })(),
    mutation: mutation,
  };
});

exports.default = {
  toFragment: toFragment,
  isMe: isMe,
  isMine: isMine,
};
