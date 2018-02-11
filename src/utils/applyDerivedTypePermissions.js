//@flow
import type { AuthPermissions, AuthMapping } from '../types';
import type { DocumentNode } from 'graphql';
import getModelTypeNames from './getModelTypeNames';
import delegateTypeResolvers from './delegateTypeResolvers';
import Authorized from '../Authorized';
import { merge } from 'lodash';

export default (typeDefs: DocumentNode): AuthPermissions => (
  permissionMap: AuthMapping,
): AuthMapping => {
  const modelTypes = getModelTypeNames(typeDefs);
  const derived = modelTypes.reduce(
    (genTypes, typeName: string) => ({
      ...genTypes,
      ...delegateTypeResolvers(typeName),
    }),
    {},
  );
  return merge(permissionMap, {
    [Authorized.GENERATED_BASE_PERMISSION_ROLE]: {
      permissions: derived,
    },
  });
};
