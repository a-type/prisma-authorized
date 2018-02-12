export { default } from './Authorized';
export { default as AuthorizationError } from './errors/AuthorizationError';
import * as r from './resolvers';
export const resolvers = r;
export {
  default as StaticPermissionMapProvider,
} from './StaticPermissionMapProvider';
export { default as Authorizer } from './Authorizer';
