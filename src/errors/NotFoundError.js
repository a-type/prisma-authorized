module.exports = class NotFoundError extends Error {
  constructor() {
    super('The requested resource doesn\'t exist');
  }
}
