// @flow
import { merge } from 'lodash';
import type { AuthMapping, AuthPermissions } from './types';

const rolePermissions = (
  authMapping: AuthMapping,
  role: string,
): AuthPermissions => {
  if (!role) {
    return {};
  }

  const queue = [];
  let currentAuth = authMapping[role];
  while (currentAuth) {
    queue.unshift(currentAuth.permissions);
    currentAuth = authMapping[currentAuth.inherits];
  }
  return merge(...queue);
};

export default rolePermissions;
