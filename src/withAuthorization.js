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
  isArray,
} from 'lodash';
import roleAuthMapping from './roleAuthMapping';
import AuthorizationError from './errors/AuthorizationError';
import gql from 'graphql-tag';
import { mapPromiseValues } from './utils';

const joinPropertyPaths = (...paths: Array<?string>): string =>
  paths.filter(Boolean).join('.');

const summarizeAuthResult = (authResult: AuthResult) => {
  const traverse = (sum, level) => {
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

export default (
  rootAuthMapping: AuthMapping,
  typeDefs: DocumentNode | string,
  prisma: Prisma,
  options: WithAuthorizationOptions,
) => (user: User) => {
  const authMapping = roleAuthMapping(rootAuthMapping, user.role);
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
    get(authMapping, joinPropertyPaths(typeName, authType, path));

  const wrapQuery = (
    queryFunction: QueryFunction,
    rootType: 'query' | 'mutation',
    queryName,
  ): WrappedQueryFunction => {
    const isRead = rootType === 'query';

    return async (inputs: {}, info: string, ctx: {}) => {
      const baseAuthContext = {
        user,
        graphqlContext: ctx,
      };

      const authorizeType = async (
        authType: AuthType,
        typeName: string,
        data: {},
        dataRoot: {},
      ): Promise<AuthResult> => {
        const authorizeLevel = async (
          levelData: any,
          path?: string,
        ): Promise<AuthResult> => {
          const resolver = getAuthResolver(authType, typeName, path);

          const authorizeLevelItem = async (item, itemPath) => {
            if (isPlainObject(resolver)) {
              // object resolver: traverse the next level of data
              // and apply child resolvers
              return mapPromiseValues(
                mapValues(item, (subData, key) => {
                  const subPath = joinPropertyPaths(itemPath, key);
                  return authorizeLevel(subData, subPath);
                }),
              );
            } else if (isBoolean(resolver)) {
              // boolean resolver: return raw value
              return resolver;
            } else if (isString(resolver)) {
              // string resolver: authorize all sub-data as the type specified
              // in the string
              return await authorizeType(authType, resolver, item, dataRoot);
            } else if (isFunction(resolver)) {
              // function resolver: call function and return result
              return await resolver(data, {
                ...baseAuthContext,
                typeName,
                fieldName: (itemPath || 'root').split('.').pop(),
                dataRoot,
              });
            } else {
              // unknown resolver type, default false.
              return false;
            }
          };

          if (isArray(levelData)) {
            return Promise.all(
              levelData.map(item => authorizeLevelItem(item, path)),
            );
          } else {
            return authorizeLevelItem(levelData, path);
          }
        };

        return authorizeLevel(data);
      };

      const inputTypes = getInputTypesForQuery(
        resolvedTypeDefs,
        rootType,
        queryName,
      );
      const responseType = getResponseTypeForQuery(
        resolvedTypeDefs,
        rootType,
        queryName,
      );

      /**
       * PHASE 1: Validate inputs against `write` rules
       * (mutations only)
       */
      if (!isRead) {
        const validateInputs = async (): Promise<AuthResult> =>
          mapPromiseValues(
            mapValues(inputs, (value, key) =>
              authorizeType('write', inputTypes[key], value, inputs),
            ),
          );

        const inputValidationResult = await validateInputs();
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
        authorizeType('read', responseType, queryResponse, queryResponse);

      const responseValidationResult = await validateResponse();
      const isResponseValid = summarizeAuthResult(responseValidationResult);

      if (!isResponseValid) {
        throw createAuthError(responseValidationResult);
      }

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
