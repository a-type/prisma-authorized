//@flow
import {
  type PermissionResolverFunction,
  type PermissionResolverValue,
  type AuthContext,
  type PermissionResolverResult,
  type PermissionResolverFunctionParams,
} from '../types';

export default (
  targetType: string,
  condition: PermissionResolverFunction,
  fallback?: PermissionResolverValue = false,
): PermissionResolverFunction => async (
  params: PermissionResolverFunctionParams,
): PermissionResolverResult => {
  if (await condition(params)) {
    return targetType;
  }
  return fallback;
};
