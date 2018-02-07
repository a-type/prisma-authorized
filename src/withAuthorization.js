//@flow
import typeof { GraphQLSchema } from 'graphql';
import { camel } from 'change-case';
import { get, mapValues, isPlainObject, isBoolean, isString } from 'lodash';
import roleAuthMapping from './roleAuthMapping';
import AuthorizationError from './errors/AuthorizationError';
import gql from 'graphql-tag';

const matchQueryType = /(create|update|upsert|delete|updateMany|deleteMany)/;

const getQueryType = (queryName: string) => {
  const queryTypeMatch = matchQueryType.exec(queryName);
  if (queryTypeMatch && queryTypeMatch[1]) {
    return queryTypeMatch[1];
  }
  throw new Error(`Unknown query type for query named ${queryName}`);
};

type AuthResult = { [string]: AuthResult | boolean };
const summarizeAuthResult = (authResult: AuthResult) => {
  const traverse = (sum, level) => {
    if (isBoolean(level)) {
      return sum && level;
    }
    return Object.values(level).reduce(traverse, sum);
  };
  return traverse(authResult, true);
};

type WithAuthorizationOptions = {};
export default (
  rootAuthMapping: AuthMapping,
  schema: GraphQLSchema,
  options: WithAuthorizationOptions,
) => (user: User) => {
  const authMapping = roleAuthMapping(rootAuthMapping, user.role);
  console.log(`authMapping ${JSON.stringify(authMapping)}`);

  const wrapQuery = (queryFunction, isRead, queryName) => {
    const queryType = isRead ? 'get' : getQueryType(queryName);
    const resourceName = camel(queryName.replace(queryType, ''));
    console.log(`processing for ${queryType} on ${resourceName}`);

    const wrappedQuery = async (variables: {}, info: string, ctx: {}) => {
      /**
       * PHASE 1: Validate variables against `write` rules
       * (mutations only)
       */
      const validateVariables = async (vars: {}): Promise<AuthResult> => {};

      const variableValidationResult = await validateVariables(variables);
      const areVariablesValid = summarizeAuthResult(variableValidationResult);

      /**
       * PHASE 2: Run query and get result
       */
      const queryResponse = await queryFunction();

      /**
       * PHASE 3: Validate response against `read` rules
       * (mutations and queries)
       */
      const validateResponse = async (response: {}): Promise<AuthResult> => {};

      const responseValidationResult = await validateResponse(queryResponse);
      const isResponseValid = summarizeAuthResult(responseValidationResult);
    };

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

  const query = mapValues(prisma.query, (fn, key) =>
    wrapQuery(fn.bind(prisma), true, key),
  );
  const mutation = mapValues(prisma.mutation, (fn, key) =>
    wrapQuery(fn.bind(prisma), false, key),
  );

  return {
    query,
    mutation,
    exists: prisma.exists.bind(prisma),
    request: prisma.request.bind(prisma),
  };
};
