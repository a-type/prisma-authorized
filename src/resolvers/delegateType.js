//@flow
import type {
  AuthResolverFunction,
  AuthResolverValue,
  AuthContext,
  AuthResolverResult,
  AuthResolverFunctionParams,
} from '../types';

export default (
  targetType: string,
  condition: AuthResolverFunction,
  fallback?: AuthResolverValue = false,
): AuthResolverFunction => async (
  params: AuthResolverFunctionParams,
): AuthResolverResult => {
  if (await condition(params)) {
    return targetType;
  }
  return fallback;
};
