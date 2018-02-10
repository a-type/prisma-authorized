//@flow

type User = {
  id: string,
  role: string,
};

type AuthContext = {
  user: User,
  prisma: Prisma,
  graphqlContext: {},
};

type Prisma = {
  query: {},
  mutation: {},
  exists: () => mixed,
  request: () => mixed,
};

type QueryRootData = {
  rootFieldName: string,
  rootTypeName: string,
  inputs: { [string]: mixed },
};

type QueryInputs = {
  [string]: mixed,
};

type AuthResolverValue = boolean | string;
type AuthResolverResult = Promise<AuthResolverValue>;
type AuthResolverFunctionParams = {
  fieldValue: mixed,
  fieldName: ?string,
  fieldPath: string,
  typeValue: {},
  typeName: string,
  context: AuthContext,
} & QueryRootData;
type AuthResolverFunction = (
  params: AuthResolverFunctionParams,
) => AuthResolverResult;
type AuthResolver =
  | boolean
  | string
  | AuthResolverFunction
  | { [string]: AuthResolver };

type AuthResult = { [string]: AuthResult } | Array<AuthResult> | boolean;

type AuthResource = {
  read: { [string]: AuthResolver },
  write: { [string]: AuthResolver },
};

type AuthPermissions = {
  [string]: AuthResource,
};
type RoleAuthMapping = {
  inherits: string,
  permissions: AuthPermissions,
};

type AuthMapping = {
  [string]: RoleAuthMapping,
};

type QueryResponse = Promise<{}>;
type QueryFunction = (inputs: {}, info: string) => QueryResponse;

type WithAuthorizationOptions = {};
type AuthType = 'read' | 'write';
type WrappedQueryFunction = (
  inputs: {},
  info: string,
  ctx: {},
) => QueryResponse;
