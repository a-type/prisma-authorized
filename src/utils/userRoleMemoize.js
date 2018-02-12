//@flow
import { runInContext } from 'lodash';
import UserRoleWeakMap from './UserRoleWeakMap';
const pristineLodash = runInContext();

pristineLodash.memoize.Cache = UserRoleWeakMap;

export default pristineLodash.memoize;
