type User = {
  id: string,
  role: string,
};

type AuthContext = {
  user: User,
  prisma: Prisma,
  typeName: string,
  fieldName: string,
  dataRoot: {},
};

type Prisma = {
  query: {},
  mutation: {},
  exists: () => mixed,
  request: () => mixed,
};

type AuthResolverValue = boolean | { [string]: AuthResolver };
type AuthResolverResult = Promise<AuthResolverValue>;
type AuthResolverFunction = (data: {}, ctx: AuthContext) => Promise<boolean>;
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

type RoleAuthMapping = {
  inherits: string,
  permissions: {
    [string]: AuthResource,
  },
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
