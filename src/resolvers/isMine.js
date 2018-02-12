import { camel } from 'change-case';
import { get } from 'lodash';
import { toFragment } from '../utils';
import {
  type PermissionResolverFunction,
  type PermissionResolverResult,
  type PermissionResolverFunctionParams,
} from '../types';

type IsMineOptions = {
  relationshipPath: string,
  resourceIdPath: string,
};
export default (
  options: IsMineOptions = {
    relationshipPath: 'user.id',
    resourceIdPath: 'id',
  },
): PermissionResolver => {
  const { relationshipPath = 'user.id', resourceIdPath = 'id' } = options;

  return async (
    params: PermissionResolverFunctionParams,
  ): PermissionResolverResult => {
    const { typeValue, typeName, context, rootFieldName } = params;

    const userId = get(typeValue, relationshipPath);
    if (userId) {
      return userId === context.user.id;
    }

    // fallback on query if info did not include relationship path

    // FIXME: this isn't an elegant solution. Is there a better way to determine the id
    // of the provided resource?
    const findId = () => {
      if ([`update${typeName}`, `delete${typeName}`].includes(rootFieldName)) {
        return get(inputs.where, resourceIdPath);
      }
      return get(typeValue, resourceIdPath);
    };

    const id = findId();
    if (!id) {
      throw new Error(
        'In order for this authorization check to work, you must include the id' +
          ' for the resource in your query. If that is not possible, please opt to use' +
          ' a custom authorization check for this permission.',
      );
    }

    const info = toFragment(relationshipPath);
    // this may not be the safest way to determine the get query for
    // a type, but it does seem to work for now...
    const getQuery = context.prisma.query[camel(typeName)];
    const relationshipResponse = await getQuery({ where: { id } }, info);
    return get(relationshipResponse, relationshipPath) === context.user.id;
  };
};
