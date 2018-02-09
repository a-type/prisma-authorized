import { get } from 'lodash';

type IsMeOptions = { userIdPath: string };
export default (
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
      throw new Error(
        'In order for this authorization check to work, you must include the id' +
          ' for the resource in your query. If that is not possible, please opt to use' +
          ' a custom authorization check for this permission.',
      );
    }
    return id === ctx.user.id;
  };
};
