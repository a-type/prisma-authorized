const { defaultsDeep } = require('lodash');

const userAuthMapping = (authMapping, role) => {
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

module.exports = userAuthMapping;
