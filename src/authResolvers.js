// @flow
import { get } from 'lodash';

export const toFragment = (path: string): string => {
  const parts = path.split('.');
  if (parts[0]) {
    if (parts[1]) {
      return `{ ${parts[0]}: ${toFragment(parts[1])} }`;
    } else {
      return `{ ${parts[0]} }`;
    }
  }
  {
    return '';
  }
};

type IsMeOptions = { userIdPath: string };
export const isMe = (options: IsMeOptions = { userIdPath: 'id' }) => {
  const { userIdPath = 'id' } = options;

  return {
    mutation: async (
      query: {},
      run: RunFunction,
      { user }: Context,
    ): Promise<boolean> => {
      const id = get(query, 'data.' + userIdPath);
      return id === user.id;
    },

    query: async (
      query: {},
      run: RunFunction,
      { user }: Context,
    ): Promise<boolean> => {
      const resource = await run();
      const id = get(resource, userIdPath);
      return id === user.id;
    },
  };
};

type IsMineOptions = {
  relationshipPath: string,
  resourceIdPath: string,
};
export const isMine = (
  resourceName: string,
  options: IsMineOptions = {
    relationshipPath: 'user.id',
    resourceIdPath: 'id',
  },
) => {
  const { relationshipPath = 'user.id', resourceIdPath = 'id' } = options;
  const mutation = async (
    query: {},
    run: RunFunction,
    { prisma, user }: Context,
  ): Promise<boolean> => {
    const id = get(query, 'data.' + resourceIdPath);
    if (!id) {
      throw new Error(
        'In order for this authorization check to work, you must include the id' +
          ' for the resource in your query. If that is not possible, please opt to use' +
          ' a custom authorization check for this permission.',
      );
    }

    const info = toFragment(relationshipPath);
    const relationshipResponse = await prisma.query[resourceName](
      { where: { id } },
      info,
    );
    return get(relationshipResponse, relationshipPath) === user.id;
  };

  return {
    query: async (
      query: {},
      run: RunFunction,
      ctx: Context,
    ): Promise<boolean> => {
      const resource = await run();
      const userId = get(resource, relationshipPath);
      if (userId) {
        return userId === ctx.user.id;
      }

      // fallback on mutation if info did not include relationship path
      return mutation({ data: resource }, run, ctx);
    },
    mutation,
  };
};

export default {
  toFragment,
  isMe,
  isMine,
};
