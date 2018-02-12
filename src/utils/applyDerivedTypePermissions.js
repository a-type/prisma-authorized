//@flow
import type { AuthPermissions, AuthMapping } from '../types';
import type { DocumentNode } from 'graphql';
import delegateTypeResolvers from './delegateTypeResolvers';
import Authorized from '../Authorized';
import { merge } from 'lodash';

export default (typeNames: Array<string>): AuthPermissions => (
  permissionMap: AuthMapping,
): AuthMapping => {
  const derived = typeNames.reduce(
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
