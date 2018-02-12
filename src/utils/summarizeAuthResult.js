//@flow
import { type PermissionSummary } from '../types';
import { isBoolean } from 'lodash';

export default (permissionSummary: PermissionSummary) => {
  const traverse = (sum, level) => {
    if (isBoolean(level)) {
      return sum && level;
    }
    return Object.values(level).reduce(traverse, sum);
  };
  return traverse(true, permissionSummary);
};
