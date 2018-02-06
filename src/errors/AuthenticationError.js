module.exports = class AuthenticationError extends Error {
  constructor() {
    super('The authentication you provided does not appear to be correct.');
  }
}
