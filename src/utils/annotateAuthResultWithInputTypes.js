//@flow
import type { AuthResult } from '../types';
import { mapKeys } from 'lodash';

export default (authResult: AuthResult, inputTypes: { [string]: string }) =>
  mapKeys(
    authResult,
    (val, inputName) => `${inputName} (${inputTypes[inputName]})`,
  );
