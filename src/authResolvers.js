const { get } = require('lodash');

const toFragment = path => {
  const parts = path.split('.');
  if (parts[0]) {
    if (parts[1]) {
      return `{ ${parts[0]}: ${toFragment(parts[1])} }`;
    } else {
      return `{ ${parts[0]} }`;
    }
  } {
    return '';
  }
};

// authResolver: async (queryResult, ctx) => bool
const isMe = (options = {}) => {
  const { userIdPath = 'id' } = options;

  return { 
    mutation: (query, run, { user }) => {
      const id = get(query, 'data.' + userIdPath);
      return Promise.resolve(id === user.id);
    },
    query: async (query, run, { user }) => {
      const resource = await run();
      const id = get(resource, userIdPath);
      return id === user.id;
    },
  };
};

const isMine = (
  resourceName, 
  options = {},
) => {
  const {
    relationshipPath = 'user.id',
    resourceIdPath = 'id', 
  } = options;
  const mutation = async (query, run, { prisma, user }) => {
    const id = get(query, 'data.' + resourceIdPath);
    if (!id) {
      throw new Error(
        'In order for this authorization check to work, you must include the id' +
        ' for the resource in your query. If that is not possible, please opt to use' +
        ' a custom authorization check for this permission.',
      );
    }

    const info = toFragment(relationshipPath);
    const relationshipResponse = await prisma.query[resourceName]({ where: { id } }, info);
    return get(relationshipResponse, relationshipPath) === user.id;
  };

  return {
    query: async (query, run, ctx) => {
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

module.exports = {
  toFragment,
  isMe,
  isMine,
};
