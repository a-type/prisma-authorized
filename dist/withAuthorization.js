'use strict';

Object.defineProperty(exports, '__esModule', {
  value: true,
});

var _templateObject = _taggedTemplateLiteral(
  ['\n        ', '\n      '],
  ['\n        ', '\n      '],
);

var _changeCase = require('change-case');

var _lodash = require('lodash');

var _roleAuthMapping = require('./roleAuthMapping');

var _roleAuthMapping2 = _interopRequireDefault(_roleAuthMapping);

var _AuthorizationError = require('./errors/AuthorizationError');

var _AuthorizationError2 = _interopRequireDefault(_AuthorizationError);

var _graphqlTag = require('graphql-tag');

var _graphqlTag2 = _interopRequireDefault(_graphqlTag);

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

function _taggedTemplateLiteral(strings, raw) {
  return Object.freeze(
    Object.defineProperties(strings, { raw: { value: Object.freeze(raw) } }),
  );
}

var matchQueryType = /(create|update|upsert|delete|updateMany|deleteMany)/;

var getQueryType = function getQueryType(queryName) {
  var queryTypeMatch = matchQueryType.exec(queryName);
  if (queryTypeMatch && queryTypeMatch[1]) {
    return queryTypeMatch[1];
  }
  throw new Error('Unknown query type for query named ' + queryName);
};

var summarizeAuthResult = function summarizeAuthResult(authResult) {
  var traverse = function traverse(sum, level) {
    if ((0, _lodash.isBoolean)(level)) {
      return sum && level;
    }
    return Object.values(level).reduce(traverse, sum);
  };
  return traverse(authResult, true);
};

var getInputTypesForQuery = function getInputTypesForQuery(
  typeDefs,
  queryFieldName,
) {};

var getResponseTypeForQuery = function getResponseTypeForQuery(
  typeDefs,
  queryFieldName,
) {};

exports.default = function(rootAuthMapping, typeDefs, options) {
  return function(user) {
    console.log(JSON.stringify(typeDefs, null, ' '));

    var authMapping = (0, _roleAuthMapping2.default)(
      rootAuthMapping,
      user.role,
    );
    console.log('authMapping ' + JSON.stringify(authMapping));
    var resolvedTypeDefs = (0, _lodash.isString)(typeDefs)
      ? (0, _graphqlTag2.default)(_templateObject, typeDefs)
      : typeDefs;

    var wrapQuery = function wrapQuery(queryFunction, rootType, queryName) {
      var isRead = rootType === 'query';
      var resourceName = (0, _changeCase.camel)(
        queryName.replace(queryType, ''),
      );
      console.log('processing for ' + queryType + ' on ' + resourceName);

      var wrappedQuery = (function() {
        var _ref = _asyncToGenerator(
          /*#__PURE__*/ regeneratorRuntime.mark(function _callee3(
            inputs,
            info,
            ctx,
          ) {
            var validateInputs,
              variableValidationResult,
              areInputsValid,
              queryResponse,
              validateResponse,
              responseValidationResult,
              isResponseValid;
            return regeneratorRuntime.wrap(
              function _callee3$(_context3) {
                while (1) {
                  switch ((_context3.prev = _context3.next)) {
                    case 0:
                      /**
                       * PHASE 1: Validate inputs against `write` rules
                       * (mutations only)
                       */
                      validateInputs = (function() {
                        var _ref2 = _asyncToGenerator(
                          /*#__PURE__*/ regeneratorRuntime.mark(
                            function _callee(inputs) {
                              return regeneratorRuntime.wrap(
                                function _callee$(_context) {
                                  while (1) {
                                    switch ((_context.prev = _context.next)) {
                                      case 0:
                                      case 'end':
                                        return _context.stop();
                                    }
                                  }
                                },
                                _callee,
                                undefined,
                              );
                            },
                          ),
                        );

                        return function validateInputs(_x4) {
                          return _ref2.apply(this, arguments);
                        };
                      })();

                      _context3.next = 3;
                      return validateInputs(inputs);

                    case 3:
                      variableValidationResult = _context3.sent;
                      areInputsValid = summarizeAuthResult(
                        variableValidationResult,
                      );

                      /**
                       * PHASE 2: Run query and get result
                       */

                      _context3.next = 7;
                      return queryFunction(inputs, info);

                    case 7:
                      queryResponse = _context3.sent;

                      /**
                       * PHASE 3: Validate response against `read` rules
                       * (mutations and queries)
                       */
                      validateResponse = (function() {
                        var _ref3 = _asyncToGenerator(
                          /*#__PURE__*/ regeneratorRuntime.mark(
                            function _callee2(response) {
                              return regeneratorRuntime.wrap(
                                function _callee2$(_context2) {
                                  while (1) {
                                    switch ((_context2.prev = _context2.next)) {
                                      case 0:
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
                        );

                        return function validateResponse(_x5) {
                          return _ref3.apply(this, arguments);
                        };
                      })();

                      _context3.next = 11;
                      return validateResponse(queryResponse);

                    case 11:
                      responseValidationResult = _context3.sent;
                      isResponseValid = summarizeAuthResult(
                        responseValidationResult,
                      );

                    case 13:
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

        return function wrappedQuery(_x, _x2, _x3) {
          return _ref.apply(this, arguments);
        };
      })();

      /*
      const getAuthResolver = queryPath =>
        get(authMapping, `${resourceName}.${queryType}.${queryPath}`, false);
       const createSubLevelRunFn = (path, run) => async () => {
        const result = await run();
        return get(result, path);
      };
       const processAuth = (rootArgs, run, info, ctx) => {
        const processPath = (value, authResolver, absoluteKey) => {
          console.log(
            `process path ${absoluteKey}, val ${JSON.stringify(value)}`,
          );
          console.log(`authResolver is ${authResolver}`);
          if (isPlainObject(authResolver)) {
            return processLevel(value, absoluteKey);
          } else if (isBoolean(authResolver)) {
            return authResolver;
          } else if (isString(authResolver)) {
            // process auth for other resource: get args at this key
            const subArgs = get(rootArgs, absoluteKey);
            const subRun = createSubLevelRunFn(absoluteKey, run);
            return processAuth(subArgs, subRun, info, ctx);
          } else {
            return authResolver(rootArgs, run, ctx);
          }
        };
         const processLevel = (args: any, levelKey?: string) => {
          console.log(
            `processing level ${levelKey || 'root'}, args ${JSON.stringify(args)}`,
          );
          return mapValues(args, (value, key) => {
            const absKey = levelKey ? `${levelKey}.${key}` : key;
            console.log(`retrieving authResolver for ${absKey}`);
            const authResolver = getAuthResolver(absKey);
            return processPath(value, authResolver, absKey);
          });
        };
         const parsedInfo = gql`
          ${info}
        `;
        console.info(parsedInfo);
         return processLevel(rootArgs);
      };
       const wrapped = async (args, info, ctx) => {
        console.info(
          `authorizing ${JSON.stringify(
            args,
          )} ${info} for ${queryType} on ${resourceName}`,
        );
        let runResult;
        const run = async () => {
          if (!runResult) {
            runResult = await queryFunction(args, info);
          }
          console.info(`run called; returning ${JSON.stringify(runResult)}`);
          return runResult;
        };
         const authResult = await processAuth(args, run, info, {
          graphqlContext: ctx,
          user,
          prisma,
        });
        console.info('Auth result');
        console.info(authResult);
        const isAuthorized = summarizeAuthResult(authResult);
        if (!isAuthorized) {
          throw new AuthorizationError(
            `Authorization check failed. Access summary for your query: ${JSON.stringify(
              authResult,
              null,
              ' ',
            )}`,
          );
        }
        return run();
      };
       return wrapped.bind(prisma);
      */
    };

    var query = (0, _lodash.mapValues)(prisma.query, function(fn, key) {
      return wrapQuery(fn.bind(prisma), true, key);
    });
    var mutation = (0, _lodash.mapValues)(prisma.mutation, function(fn, key) {
      return wrapQuery(fn.bind(prisma), false, key);
    });

    return {
      query: query,
      mutation: mutation,
      exists: prisma.exists.bind(prisma),
      request: prisma.request.bind(prisma),
    };
  };
};
