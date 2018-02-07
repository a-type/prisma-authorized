'use strict';

Object.defineProperty(exports, '__esModule', {
  value: true,
});

function _classCallCheck(instance, Constructor) {
  if (!(instance instanceof Constructor)) {
    throw new TypeError('Cannot call a class as a function');
  }
}

function _possibleConstructorReturn(self, call) {
  if (!self) {
    throw new ReferenceError(
      "this hasn't been initialised - super() hasn't been called",
    );
  }
  return call && (typeof call === 'object' || typeof call === 'function')
    ? call
    : self;
}

function _inherits(subClass, superClass) {
  if (typeof superClass !== 'function' && superClass !== null) {
    throw new TypeError(
      'Super expression must either be null or a function, not ' +
        typeof superClass,
    );
  }
  subClass.prototype = Object.create(superClass && superClass.prototype, {
    constructor: {
      value: subClass,
      enumerable: false,
      writable: true,
      configurable: true,
    },
  });
  if (superClass)
    Object.setPrototypeOf
      ? Object.setPrototypeOf(subClass, superClass)
      : (subClass.__proto__ = superClass);
}

var AuthorizationError = (function(_Error) {
  _inherits(AuthorizationError, _Error);

  function AuthorizationError(message) {
    _classCallCheck(this, AuthorizationError);

    return _possibleConstructorReturn(
      this,
      (
        AuthorizationError.__proto__ ||
        Object.getPrototypeOf(AuthorizationError)
      ).call(
        this,
        "You don't have authorization to perform that action.\n" + message,
      ),
    );
  }

  return AuthorizationError;
})(Error);

exports.default = AuthorizationError;
