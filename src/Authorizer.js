//@flow

class Authorizer {
  authMapping: AuthMapping;

  constructor(authMapping: AuthMapping) {
    this.authMapping = authMapping;
  }

  authorize = async ({
    typeName: string,
    authType: AuthType,
    data: {},
    dataRoot: {},
    baseAuthContext: { user: User, graphqlContext: {} },
  }): Promise<AuthResult> => {
    const authorizeLevel = async (
      levelData: any,
      path?: string,
    ): Promise<AuthResult> => {
      const resolver = getAuthResolver(authType, typeName, path);

      const authorizeLevelItem = async (item, itemPath) => {
        const computedResolver = isFunction(resolver)
          ? await resolver(data, {
              ...baseAuthContext,
              typeName,
              fieldName: (itemPath || 'root').split('.').pop(),
              dataRoot,
            })
          : resolver;

        if (isPlainObject(computedResolver)) {
          // object resolver: traverse the next level of data
          // and apply child resolvers
          return mapPromiseValues(
            mapValues(item, (subData, key) => {
              const subPath = joinPropertyPaths(itemPath, key);
              return authorizeLevel(subData, subPath);
            }),
          );
        } else if (isBoolean(computedResolver)) {
          // boolean resolver: return raw value
          return computedResolver;
        } else if (isString(computedResolver)) {
          // string resolver: authorize all sub-data as the type specified
          // in the string
          return await authorizeType(
            authType,
            computedResolver,
            item,
            dataRoot,
          );
        } else {
          // unknown resolver type, default false.
          return false;
        }
      };

      if (isArray(levelData)) {
        return Promise.all(
          levelData.map(item => authorizeLevelItem(item, path)),
        );
      } else {
        return authorizeLevelItem(levelData, path);
      }
    };

    return authorizeLevel(data);
  };
}

export default async (
  authMapping: AuthMapping,
  typeName: string,
  authType: AuthType,
  path: string,
  data: {},
  dataRoot: {},
  baseAuthContext: { user: User, graphqlContext: {} },
): Promise<AuthResult> => {
  const authorizeLevel = async (
    levelData: any,
    path?: string,
  ): Promise<AuthResult> => {
    const resolver = getAuthResolver(authType, typeName, path);

    const authorizeLevelItem = async (item, itemPath) => {
      const computedResolver = isFunction(resolver)
        ? await resolver(data, {
            ...baseAuthContext,
            typeName,
            fieldName: (itemPath || 'root').split('.').pop(),
            dataRoot,
          })
        : resolver;

      if (isPlainObject(computedResolver)) {
        // object resolver: traverse the next level of data
        // and apply child resolvers
        return mapPromiseValues(
          mapValues(item, (subData, key) => {
            const subPath = joinPropertyPaths(itemPath, key);
            return authorizeLevel(subData, subPath);
          }),
        );
      } else if (isBoolean(computedResolver)) {
        // boolean resolver: return raw value
        return computedResolver;
      } else if (isString(computedResolver)) {
        // string resolver: authorize all sub-data as the type specified
        // in the string
        return await authorizeType(authType, computedResolver, item, dataRoot);
      } else {
        // unknown resolver type, default false.
        return false;
      }
    };

    if (isArray(levelData)) {
      return Promise.all(levelData.map(item => authorizeLevelItem(item, path)));
    } else {
      return authorizeLevelItem(levelData, path);
    }
  };

  return authorizeLevel(data);
};
