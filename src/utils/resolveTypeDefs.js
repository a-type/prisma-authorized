//@flow
import type { DocumentNode } from 'graphql';
import { isString } from 'lodash';
import gql from 'graphql-tag';
import { importSchema } from 'graphql-import';

const resolveTypeDefs = (typeDefs: string | DocumentNode) => {
  if (isString(typeDefs)) {
    if (typeDefs.endsWith('.graphql')) {
      return gql`
        ${importSchema(typeDefs)}
      `;
    } else {
      return gql`
        ${typeDefs}
      `;
    }
  }
  return typeDefs;
};

export default resolveTypeDefs;
