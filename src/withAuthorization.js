//@flow
import type {
  DocumentNode,
  FieldDefinitionNode,
  TypeNode,
  InputValueDefinitionNode,
} from 'graphql';
import { camel } from 'change-case';
import {
  get,
  mapValues,
  isPlainObject,
  isBoolean,
  isString,
  isFunction,
} from 'lodash';
import roleAuthMapping from './roleAuthMapping';
import AuthorizationError from './errors/AuthorizationError';
import gql from 'graphql-tag';
import { mapPromiseValues } from './utils';

const joinPropertyPaths = (...paths: Array<?string>): string =>
  paths.filter(Boolean).join('.');

type AuthResult = { [string]: AuthResult } | boolean;

const summarizeAuthResult = (authResult: AuthResult) => {
  console.info(`summarizing: ${JSON.stringify(authResult)}`);
  const traverse = (sum, level) => {
    console.info(`level ${level}: ${sum}`);
    if (isBoolean(level)) {
      return sum && level;
    }
    return Object.values(level).reduce(traverse, sum);
  };
  return traverse(true, authResult);
};

// TODO: memoize
const getQueryField = (
  typeDefs: DocumentNode,
  rootField: string,
  queryFieldName: string,
): FieldDefinitionNode => {
  const root = get(typeDefs, 'definitions', []).find(
    def => def.name.value === rootField,
  );
  return get(root, 'fields', []).find(
    field => field.name.value === queryFieldName,
  );
};

const getTypeName = (typeNode: TypeNode): string => {
  switch (typeNode.kind) {
    case 'NamedType':
      return typeNode.name.value;
    case 'ListType':
      return getTypeName(typeNode.type);
    case 'NonNullType':
      return getTypeName(typeNode.type);
    default:
      return 'Unknown';
  }
};

const getInputTypesForQuery = (
  typeDefs: DocumentNode,
  rootField: string,
  queryFieldName: string,
): { [string]: string } => {
  const field = getQueryField(typeDefs, rootField, queryFieldName);
  return (field.arguments || []).reduce(
    (map: { [string]: string }, arg: InputValueDefinitionNode) => {
      const inputName = arg.name.value;
      const typeName = getTypeName(arg.type);
      return {
        ...map,
        [inputName]: typeName,
      };
    },
    {},
  );
};

const getResponseTypeForQuery = (
  typeDefs: DocumentNode,
  rootField: string,
  queryFieldName: string,
): string => {
  const field = getQueryField(typeDefs, rootField, queryFieldName);
  return getTypeName(field.type);
};

const createAuthError = (result: AuthResult): AuthorizationError => {
  return new AuthorizationError(
    `Detailed access result: ${JSON.stringify(result)}`,
  );
};

type WithAuthorizationOptions = {};
type AuthType = 'read' | 'write';
type WrappedQueryFunction = (
  inputs: {},
  info: string,
  ctx: {},
) => QueryResponse;

export default (
  rootAuthMapping: AuthMapping,
  typeDefs: DocumentNode | string,
  prisma: Prisma,
  options: WithAuthorizationOptions,
) => (user: User) => {
  const authMapping = roleAuthMapping(rootAuthMapping, user.role);
  console.log(`authMapping ${JSON.stringify(authMapping)}`);
  const resolvedTypeDefs: DocumentNode = isString(typeDefs)
    ? gql`
        ${typeDefs}
      `
    : typeDefs;

  const getAuthResolver = (
    authType: AuthType,
    typeName: string,
    path?: string,
  ): AuthResolver =>
    get(authMapping, joinPropertyPaths(typeName, authType, path), false);

  const wrapQuery = (
    queryFunction: QueryFunction,
    rootType: 'query' | 'mutation',
    queryName,
  ): WrappedQueryFunction => {
    console.info(`processing ${rootType}.${queryName}`);
    const isRead = rootType === 'query';

    return async (inputs: {}, info: string, ctx: {}) => {
      const authContext = {
        user,
        graphqlContext: ctx,
      };

      const authorizeType = async (
        authType: AuthType,
        typeName: string,
        data: {},
      ): Promise<AuthResult> => {
        const authorizeLevel = async (
          levelData: any,
          path?: string,
        ): Promise<AuthResult> => {
          console.info(
            `auth level ${path || 'root'}, ${JSON.stringify(levelData)}`,
          );
          const resolver = getAuthResolver(authType, typeName, path);
          console.info(`resolver is: ${JSON.stringify(resolver)}`);

          if (isPlainObject(resolver)) {
            // object resolver: traverse the next level of data
            // and apply child resolvers
            return mapPromiseValues(
              mapValues(levelData, (subData, key) => {
                const subPath = joinPropertyPaths(path, key);
                return authorizeLevel(subData, subPath);
              }),
            );
          } else if (isBoolean(resolver)) {
            // boolean resolver: return raw value
            return resolver;
          } else if (isString(resolver)) {
            // string resolver: authorize all sub-data as the type specified
            // in the string
            return await authorizeType(authType, resolver, levelData);
          } else if (isFunction(resolver)) {
            // function resolver: call function and return result
            return await resolver(data, authContext);
          } else {
            // unknown resolver type, default false.
            console.warn(
              `Unknown resolver type: ${typeof resolver} (${JSON.stringify(
                resolver,
              )}`,
            );
            return false;
          }
        };

        return authorizeLevel(data);
      };

      const inputTypes = getInputTypesForQuery(
        resolvedTypeDefs,
        rootType,
        queryName,
      );
      console.info(`input types: ${JSON.stringify(inputTypes)}`);
      const responseType = getResponseTypeForQuery(
        resolvedTypeDefs,
        rootType,
        queryName,
      );
      console.info(`response type: ${responseType}`);

      /**
       * PHASE 1: Validate inputs against `write` rules
       * (mutations only)
       */
      if (!isRead) {
        const validateInputs = async (): Promise<AuthResult> =>
          mapPromiseValues(
            mapValues(inputs, (value, key) =>
              authorizeType('write', inputTypes[key], value),
            ),
          );

        const inputValidationResult = await validateInputs();
        console.info(
          `input validation: ${JSON.stringify(inputValidationResult)}`,
        );
        const areInputsValid = summarizeAuthResult(inputValidationResult);

        if (!areInputsValid) {
          throw createAuthError(inputValidationResult);
        }
      }

      /**
       * PHASE 2: Run query and get result
       */
      const queryResponse = await queryFunction(inputs, info);

      /**
       * PHASE 3: Validate response against `read` rules
       * (mutations and queries)
       */
      const validateResponse = async (): Promise<AuthResult> =>
        authorizeType('read', responseType, queryResponse);

      const responseValidationResult = await validateResponse();
      console.info(
        `response validation: ${JSON.stringify(responseValidationResult)}`,
      );
      const isResponseValid = summarizeAuthResult(responseValidationResult);

      if (!isResponseValid) {
        throw createAuthError(responseValidationResult);
      }

      console.info(`validation passed!`);
      return queryResponse;
    };
  };

  const query = mapValues(prisma.query, (fn, key) =>
    wrapQuery(fn.bind(prisma), 'query', key),
  );
  const mutation = mapValues(prisma.mutation, (fn, key) =>
    wrapQuery(fn.bind(prisma), 'mutation', key),
  );

  return {
    query,
    mutation,
    exists: prisma.exists.bind(prisma),
    request: prisma.request.bind(prisma),
  };
};
