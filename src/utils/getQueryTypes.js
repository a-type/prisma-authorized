//@flow
import type {
  DocumentNode,
  FieldDefinitionNode,
  InputValueDefinitionNode,
} from 'graphql';
import { get } from 'lodash';
import getTypeName from './getTypeName';

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

export default {
  input: getInputTypesForQuery,
  response: getResponseTypeForQuery,
};
