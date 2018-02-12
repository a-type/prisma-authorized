// @flow
import {
  type PermissionMapProvider,
  type PermissionMap,
  type User,
  type AuthType,
  type PermissionQueue,
  type PermissionMapProviderOptions,
} from './types';
import { get, memoize } from 'lodash';
import { applyDerivedTypePermissions, userRoleMemoize } from './utils';

export default class StaticPermissionMapProvider
  implements PermissionMapProvider {
  permissionMap: PermissionMap;

  constructor(
    staticPermissionMap: PermissionMap,
    options?: PermissionMapProviderOptions,
  ) {
    const { generateDerivedPermissions = [] } = options;

    this.permissionMap = applyDerivedTypePermissions(
      generateDerivedPermissions,
    )(staticPermissionMap);
  }

  getUserPermissions = userRoleMemoize((user: User): PermissionQueue => {
    let role = get(user, 'role', 'ANONYMOUS');
    const permissions: PermissionQueue = [];
    while (this.permissionMap[role]) {
      permissions.push(get(this.permissionMap[role], 'permissions'));
      role = get(this.permissionMap[role], 'inherits');
    }
    return permissions;
  });
}
