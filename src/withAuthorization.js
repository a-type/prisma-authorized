//@flow
import type {
  DocumentNode,
  FieldDefinitionNode,
  TypeNode,
  InputValueDefinitionNode,
} from 'graphql';
import { camel, pascal } from 'change-case';
import {
  get,
  mapValues,
  isPlainObject,
  isBoolean,
  isString,
  isFunction,
  isArray,
} from 'lodash';
import AuthorizationError from './errors/AuthorizationError';
import gql from 'graphql-tag';
import { mapPromiseValues, joinPropertyPaths } from './utils';
import Authorizer from './Authorizer';
import type {
  AuthResult,
  AuthContext,
  QueryInputs,
  User,
  QueryRootData,
  QueryFunction,
  WrappedQueryFunction,
  Prisma,
  WithAuthorizationOptions,
} from './types';

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
    /* istanbul ignore next */
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
  const resolvedTypeDefs: DocumentNode = isString(typeDefs)
    ? gql`
        ${typeDefs}
      `
    : typeDefs;

  const authorizer = new Authorizer(rootAuthMapping);

  const wrapQuery = (
    queryFunction: QueryFunction,
    rootType: 'query' | 'mutation',
    queryName,
  ): WrappedQueryFunction => {
    const isRead = rootType === 'query';

    return async (inputs: ?QueryInputs, info: string, ctx: {}) => {
      const context: AuthContext = {
        user,
        graphqlContext: ctx,
        prisma,
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

      const rootData: QueryRootData = {
        rootFieldName: queryName,
        rootTypeName: pascal(rootType),
        inputs,
      };

      /**
       * PHASE 1: Validate inputs against `write` rules
       * (mutations only)
       */
      if (!isRead) {
        const validateInputs = async (): Promise<AuthResult> =>
          mapPromiseValues(
            mapValues(inputs, (value, key) =>
              authorizer.authorize({
                typeName: inputTypes[key],
                authType: 'write',
                data: value,
                context,
                rootData,
              }),
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
        authorizer.authorize({
          typeName: responseType,
          authType: 'read',
          data: queryResponse,
          context,
          rootData,
        });

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
