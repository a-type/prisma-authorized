import { merge } from 'lodash';

const rolesAuthMapping = (authMapping, role) => {
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

export default rolesAuthMapping;
