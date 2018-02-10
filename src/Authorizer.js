//@flow
import {
  get,
  memoize,
  isArray,
  isFunction,
  isString,
  isPlainObject,
  isBoolean,
  mapValues,
} from 'lodash';
import { joinPropertyPaths, mapPromiseValues } from './utils';
import rolePermissions from './rolePermissions';

export default class Authorizer {
  authMapping: AuthMapping;
  memoizedRolePermissions: (role: string) => AuthPermissions;

  constructor(authMapping: AuthMapping) {
    this.authMapping = authMapping;
    this.memoizedRolePermissions = memoize(role =>
      rolePermissions(authMapping, role),
    );
  }

  getAuthResolver = (
    role: string,
    typeName: string,
    authType: AuthType,
    fieldPath?: string,
  ): ?AuthResolver => {
    const rolePermissions = this.memoizedRolePermissions(role);
    return get(
      rolePermissions,
      joinPropertyPaths(typeName, authType, fieldPath),
    );
  };

  resolveValueAccess = async (data: {
    typeName: string,
    typeValue: {},
    authType: AuthType,
    fieldPath?: string,
    fieldValue: mixed,
    context: AuthContext,
    rootData: QueryRootData,
  }): Promise<AuthResult> => {
    const {
      typeName,
      typeValue,
      authType,
      fieldValue,
      context,
      fieldPath,
      rootData,
    } = data;
    const role = context.user.role;
    const fieldName = fieldPath ? fieldPath.split('.').pop() : undefined;

    if (isArray(fieldValue)) {
      return Promise.all(
        // do not change pathname
        fieldValue.map(item =>
          this.resolveValueAccess({
            ...data,
            fieldValue: item,
          }),
        ),
      );
    }

    const rawResolver = this.getAuthResolver(
      role,
      typeName,
      authType,
      fieldPath,
    );
    // pre-compute a function resolver and use its resulting value
    const resolver = isFunction(rawResolver)
      ? await rawResolver({
          typeName,
          typeValue,
          fieldValue: fieldValue,
          fieldName,
          fieldPath,
          ...rootData,
          context,
        })
      : rawResolver;

    if (isPlainObject(resolver)) {
      return mapPromiseValues(
        mapValues((fieldValue: {}), (subValue, key) => {
          const subPath = joinPropertyPaths(fieldPath, key);
          return this.resolveValueAccess({
            ...data,
            fieldPath: subPath,
            fieldValue: subValue,
          });
        }),
      );
    } else if (isBoolean(resolver)) {
      return resolver;
    } else if (isString(resolver)) {
      return await this.resolveValueAccess({
        ...data,
        typeName: resolver,
        typeValue: fieldValue,
      });
    } else {
      // unknown resolver type
      return false;
    }
  };

  authorize = async (info: {
    typeName: string,
    authType: AuthType,
    data: {},
    context: AuthContext,
    rootData: QueryRootData,
  }): Promise<AuthResult> => {
    const { typeName, authType, data, context, rootData } = info;

    return this.resolveValueAccess({
      typeName,
      typeValue: data,
      authType,
      fieldValue: data,
      rootValue: data,
      context,
      rootData,
    });
  };
}
