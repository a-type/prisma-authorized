// @flow
import { get } from 'lodash';
import { camel } from 'change-case';
import { toFragment } from './utils';

type IsMeOptions = { userIdPath: string };
export const isMe = (
  options: IsMeOptions = { userIdPath: 'id' },
): AuthResolver => {
  const { userIdPath = 'id' } = options;

  return async (data: {}, ctx: AuthContext): Promise<boolean> => {
    const id = get(data, userIdPath);
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

  return async (data: {}, ctx: AuthContext): Promise<boolean> => {
    const userId = get(data, relationshipPath);
    if (userId) {
      return userId === ctx.user.id;
    }

    // fallback on query if info did not include relationship path
    const id = get(data, resourceIdPath);
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
