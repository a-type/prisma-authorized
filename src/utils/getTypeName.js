//@flow
import type { TypeNode } from 'graphql';

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

export default getTypeName;
