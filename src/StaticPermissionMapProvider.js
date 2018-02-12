// @flow
import {
  type PermissionMapProvider,
  type PermissionMap,
  type User,
  type PermissionQueue,
  type PermissionMapProviderOptions,
  type RolePermissions,
} from './types';
import { get, memoize } from 'lodash';
import { delegateTypeResolvers, userRoleMemoize } from './utils';

export default class StaticPermissionMapProvider
  implements PermissionMapProvider {
  permissionMap: PermissionMap;
  basePermissions: RolePermissions;

  constructor(
    staticPermissionMap: PermissionMap,
    options?: PermissionMapProviderOptions = {},
  ) {
    const { generateDerivedPermissions = [] } = options;

    this.permissionMap = staticPermissionMap;
    this.basePermissions = generateDerivedPermissions.reduce(
      (map, typeName) => ({
        ...map,
        ...delegateTypeResolvers(typeName),
      }),
      {},
    );
  }

  getUserPermissions = userRoleMemoize((user: User): PermissionQueue => {
    let role = get(user, 'role', 'ANONYMOUS');
    const permissions: PermissionQueue = [];
    while (this.permissionMap[role]) {
      permissions.push(get(this.permissionMap[role], 'permissions'));
      role = get(this.permissionMap[role], 'inherits');
    }
    permissions.push(this.basePermissions);
    return permissions;
  });
}
