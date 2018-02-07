export default class AuthorizationError extends Error {
  constructor(message) {
    super("You don't have authorization to perform that action.\n" + message);
  }
}
