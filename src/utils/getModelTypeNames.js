//@flow
import type { DocumentNode } from 'graphql';
import { get } from 'lodash';

export default (typeDefs: DocumentNode) => {
  const implementNodeTypes = typeDefs.definitions.filter(
    def =>
      get(def, 'interfaces', []).filter(
        ifc => get(ifc, 'name.value') === 'Node',
      ).length > 0,
  );
  return implementNodeTypes.map(type => type.name.value);
};
