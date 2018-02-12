// @flow
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
import { joinPropertyPaths, mapPromiseValues, rolePermissions } from './utils';
import {
  type PermissionMapProvider,
  type PermissionResolver,
  type AccessType,
  type RolePermissions,
  type AuthContext,
  type QueryRootData,
  type PermissionSummary,
  type User,
} from './types';

export default class Authorizer {
  permissionProvider: PermissionMapProvider;

  constructor(permissionProvider: PermissionMapProvider) {
    this.permissionProvider = permissionProvider;
  }

  getPathResolver = (
    rolePermissions: RolePermissions,
    typeName: string,
    authType: AccessType,
    fieldPathParts: Array<string>,
  ): ?PermissionResolver => {
    const parts = [typeName, authType, ...fieldPathParts];
    const traverse = (
      permissions: {},
      parts: Array<string>,
    ): PermissionResolver => {
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

  resolveValueAccess = async (data: {
    typeName: string,
    typeValue: {},
    authType: AccessType,
    fieldPath?: string,
    fieldValue: mixed,
    context: AuthContext,
    rootData: QueryRootData,
    user: User,
  }): Promise<PermissionSummary> => {
    const {
      typeName,
      typeValue,
      authType,
      fieldValue,
      context,
      fieldPath,
      rootData,
      user,
    } = data;

    const permissions = this.permissionProvider.getUserPermissions(user);

    for (let permission of permissions) {
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
        permission,
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
      if (value !== null) {
        return value;
      }

      // if value is null, there was no explicit permission set for this field in this permission group.
      // fall back to the next permission group, if available.
    }

    // after iterating through all provided permissions for the user, we did
    // not find any rules matching this field. Default to block access.
    return false;
  };

  authorize = async (info: {
    typeName: string,
    authType: AccessType,
    data: {},
    context: AuthContext,
    rootData: QueryRootData,
  }): Promise<PermissionSummary> => {
    const { typeName, authType, data, context, rootData } = info;

    return this.resolveValueAccess({
      typeName,
      typeValue: data,
      authType,
      fieldValue: data,
      rootValue: data,
      context,
      rootData,
      user: get(context, 'user'),
    });
  };
}
