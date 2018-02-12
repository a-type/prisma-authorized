// @flow

export type User = {
  id: string,
  role: string,
};

export type AuthContext = {
  user: User,
  prisma: Prisma,
  graphqlContext: {},
};

export type Prisma = {
  query: {},
  mutation: {},
  exists: () => mixed,
  request: () => mixed,
};

export type AuthorizedPrisma = {
  query: {},
  mutation: {},
};

export type QueryRootData = {
  rootFieldName: string,
  rootTypeName: string,
  inputs: { [string]: mixed },
};
export type QueryInputs = {
  [string]: mixed,
};

export type PermissionResolverValue = boolean | string;
export type PermissionResolverResult = Promise<PermissionResolverValue>;
export type PermissionResolverFunctionParams = {
  fieldValue: mixed,
  fieldName: ?string,
  fieldPath: string,
  typeValue: {},
  typeName: string,
  context: AuthContext,
} & QueryRootData;
export type PermissionResolverFunction = (
  params: PermissionResolverFunctionParams,
) => PermissionResolverResult;
export type PermissionResolver =
  | boolean
  | string
  | PermissionResolverFunction
  | { [string]: PermissionResolver };

export type PermissionSummary =
  | { [string]: PermissionSummary }
  | Array<PermissionSummary>
  | boolean;

export type ResourcePermissions = {
  read: { [string]: PermissionResolver },
  write: { [string]: PermissionResolver },
};

export type RolePermissions = {
  [string]: ResourcePermissions,
};
export type PermissionQueue = Array<RolePermissions>;
export type RolePermissionDescription = {
  inherits: string,
  permissions: RolePermissions,
};

export type PermissionMap = {
  [string]: RolePermissionDescription,
};

export interface PermissionMapProvider {
  getUserPermissions(user: User): PermissionQueue;
}

export type QueryResponse = Promise<{}>;
export type QueryFunction = (inputs: {}, info: string) => QueryResponse;

export type PermissionMapProviderOptions = {
  generateDerivedPermissions?: Array<string>,
};
export type AccessType = 'read' | 'write';
export type WrappedQueryFunction = (
  inputs: {},
  info: string,
  ctx: {},
) => QueryResponse;
