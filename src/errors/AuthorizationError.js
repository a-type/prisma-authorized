module.exports = class AuthorizationError extends Error {
  constructor() {
    super('You\'re not authorized to perform that operation');
  }
}
