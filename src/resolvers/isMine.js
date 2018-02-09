import { camel } from 'change-case';
import { get } from 'lodash';
import { toFragment } from '../utils';

type IsMineOptions = {
  relationshipPath: string,
  resourceIdPath: string,
};
export default (
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
