'use strict';

Object.defineProperty(exports, '__esModule', {
  value: true,
});

var _lodash = require('lodash');

var rolesAuthMapping = function rolesAuthMapping(authMapping, role) {
  if (!role) {
    return {};
  }

  var queue = [];
  var currentAuth = authMapping[role];
  while (currentAuth) {
    queue.push(currentAuth.permissions);
    currentAuth = authMapping[currentAuth.inherits];
  }
  return _lodash.defaultsDeep.apply(undefined, queue);
};

exports.default = rolesAuthMapping;
