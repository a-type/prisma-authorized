import { get } from 'lodash';

type IsMeOptions = { userIdPath: string };
export default (
  options: IsMeOptions = { userIdPath: 'id', userTypeName: 'User' },
): AuthResolver => {
  const { userIdPath = 'id', userTypeName = 'User' } = options;

  return async (params: AuthResolverFunctionParams): AuthResolverResult => {
    const {
      context,
      typeValue,
      typeName,
      rootFieldName,
      rootTypeName,
      inputs,
    } = params;

    if (typeName !== userTypeName) {
      throw new Error(
        `The isMe check should only be applied to a field or sub-field of a ${userTypeName} ` +
          'type.',
      );
    }

    // FIXME: this isn't an elegant solution. Is there a better way to tell if the user
    // being updated or deleted is the authenticated user?
    const findId = () => {
      if (
        [`update${userTypeName}`, `delete${userTypeName}`].includes(
          rootFieldName,
        )
      ) {
        return get(inputs.where, userIdPath);
      }
      return get(typeValue, userIdPath);
    };

    const id = findId();
    if (!id) {
      throw new Error(
        'In order for this authorization check to work, you must include the id' +
          ' for the resource in your query. If that is not possible, please opt to use' +
          ' a custom authorization check for this permission.',
      );
    }
    return id === context.user.id;
  };
};
