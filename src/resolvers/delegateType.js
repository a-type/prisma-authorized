//@flow

export default (
  targetType: string,
  condition: AuthResolverFunction,
  fallback?: AuthResolverValue = false,
): AuthResolverFunction => async (
  data: {},
  ctx: AuthContext,
): AuthResolverResult => {
  if (await condition(data, ctx)) {
    return targetType;
  }
  return fallback;
};
