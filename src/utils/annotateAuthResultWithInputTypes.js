//@flow
import { type PermissionSummary } from '../types';
import { mapKeys, isBoolean } from 'lodash';

export default (
  permissionSummary: PermissionSummary,
  inputTypes: { [string]: string },
) =>
  isBoolean(permissionSummary)
    ? permissionSummary
    : mapKeys(
        permissionSummary,
        (val, inputName) => `${inputName} (${inputTypes[inputName]})`,
      );
