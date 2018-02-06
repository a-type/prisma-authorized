import { defaultsDeep } from 'lodash';

const rolesAuthMapping = (authMapping, role) => {
  if (!role) {
    return {};
  }

  const queue = [];
  let currentAuth = authMapping[role];
  while (currentAuth) {
    queue.push(currentAuth.permissions);
    currentAuth = authMapping[currentAuth.inherits];
  }
  return defaultsDeep(...queue);
};

export default rolesAuthMapping;
