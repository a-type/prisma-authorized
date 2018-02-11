//@flow
import type { AuthResult } from '../types';
import { isBoolean } from 'lodash';

export default (authResult: AuthResult) => {
  const traverse = (sum, level) => {
    if (isBoolean(level)) {
      return sum && level;
    }
    return Object.values(level).reduce(traverse, sum);
  };
  return traverse(true, authResult);
};
