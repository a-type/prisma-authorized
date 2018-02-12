//@flow
import type { DocumentNode } from 'graphql';
import { get } from 'lodash';

export default (typeDefs: DocumentNode): Array<string> => {
  const implementNodeTypes = typeDefs.definitions.filter(
    def =>
      get(def, 'interfaces', []).filter(
        ifc => get(ifc, 'name.value') === 'Node',
      ).length > 0,
  );
  return implementNodeTypes.map(type => get(type, 'name.value'));
};
