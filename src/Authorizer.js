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
  isUndefined,
} from 'lodash';
import { joinPropertyPaths, mapPromiseValues } from './utils';
import rolePermissions from './rolePermissions';
import type {
  AuthMapping,
  AuthResolver,
  AuthType,
  AuthPermissions,
  AuthContext,
  QueryRootData,
  AuthResult,
} from './types';

export default class Authorizer {
  authMapping: AuthMapping;

  constructor(authMapping: AuthMapping) {
    this.authMapping = authMapping;
  }

  getPathResolver = (
    rolePermissions: AuthPermissions,
    typeName: string,
    authType: AuthType,
    fieldPathParts: Array<string>,
  ): ?AuthResolver => {
    const parts = [typeName, authType, ...fieldPathParts];
    const traverse = (permissions: {}, parts: Array<string>): AuthResolver => {
      const [part, ...rest] = parts;
      const level = get(permissions, part);
      if (isPlainObject(level) && !!rest.length) {
        return traverse(level, rest);
      } else {
        return level;
      }
    };
    return traverse(rolePermissions, parts);
  };

  getInheritedRole = (role: string): ?string =>
    get(this.authMapping, joinPropertyPaths(role, 'inherits'));

  resolveValueAccess = async (data: {
    typeName: string,
    typeValue: {},
    authType: AuthType,
    fieldPath?: string,
    fieldValue: mixed,
    context: AuthContext,
    rootData: QueryRootData,
    role: string,
  }): Promise<AuthResult> => {
    const {
      typeName,
      typeValue,
      authType,
      fieldValue,
      context,
      fieldPath,
      rootData,
      role,
    } = data;
    const rolePermissions = get(
      this.authMapping,
      joinPropertyPaths(role, 'permissions'),
      {},
    );
    const inheritedRole = this.getInheritedRole(role);
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

    const rawResolver = this.getPathResolver(
      rolePermissions,
      typeName,
      authType,
      fieldPath ? fieldPath.split('.') : [],
    );
    // pre-compute a function resolver and use its resulting value
    const resolver = isFunction(rawResolver)
      ? await rawResolver({
          typeName,
          typeValue,
          fieldValue,
          fieldName,
          fieldPath,
          ...rootData,
          context,
        })
      : rawResolver;

    const resolveValue = async () => {
      if (isPlainObject(resolver)) {
        if (isPlainObject(fieldValue)) {
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
        } else {
          throw new Error(
            `An object permission map was provided for field ${fieldPath ||
              '<root>'}` +
              ` on type ${typeName}, but this field is a primitive type.`,
          );
        }
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
        return null;
      }
    };

    const value = await resolveValue();
    if (value === null && inheritedRole) {
      // for auth failure, fallback on inherited role if available
      return await this.resolveValueAccess({ ...data, role: inheritedRole });
    }

    return value === null ? false : value;
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
      role: get(context, 'user.role'),
    });
  };
}
