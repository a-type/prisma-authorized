// @flow
import { get } from 'lodash';
import { camel } from 'change-case';
import { toFragment } from './utils';

const mustDefineIdError = new Error(
  'In order for this authorization check to work, you must include the id' +
    ' for the resource in your query. If that is not possible, please opt to use' +
    ' a custom authorization check for this permission.',
);

type IsMeOptions = { userIdPath: string };
export const isMe = (
  options: IsMeOptions = { userIdPath: 'id', userTypeName: 'User' },
): AuthResolver => {
  const { userIdPath = 'id', userTypeName = 'User' } = options;

  return async (data: {}, ctx: AuthContext): AuthResolverResult => {
    if (ctx.typeName !== userTypeName) {
      throw new Error(
        `The isMe check should only be applied to a field or sub-field of a ${userTypeName} ` +
          'type. ',
      );
    }
    // a bit of a hack... perhaps another resolver would be a cleaner solution
    const id = get(data, userIdPath, get(ctx.dataRoot, 'where.' + userIdPath));
    if (!id) {
      throw mustDefineIdError;
    }
    return id === ctx.user.id;
  };
};

type IsMineOptions = {
  relationshipPath: string,
  resourceIdPath: string,
};
export const isMine = (
  getFieldName: string,
  options: IsMineOptions = {
    relationshipPath: 'user.id',
    resourceIdPath: 'id',
  },
): AuthResolver => {
  const { relationshipPath = 'user.id', resourceIdPath = 'id' } = options;

  return async (data: {}, ctx: AuthContext): AuthResolverResult => {
    const userId = get(data, relationshipPath);
    if (userId) {
      return userId === ctx.user.id;
    }

    // fallback on query if info did not include relationship path
    const id = get(data, resourceIdPath);
    if (!id) {
      throw mustDefineIdError;
    }

    const info = toFragment(relationshipPath);
    // this may not be the safest way to determine the get query for
    // a type, but it does seem to work for now...
    const getQuery = ctx.prisma.query[camel(ctx.typeName)];
    const relationshipResponse = await getQuery({ where: { id } }, info);
    return get(relationshipResponse, relationshipPath) === ctx.user.id;
  };
};

export default {
  toFragment,
  isMe,
  isMine,
};
