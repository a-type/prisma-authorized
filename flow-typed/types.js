type User = {
  id: string,
  role: string,
};

type AuthContext = {
  user: User,
  prisma: Prisma,
  typeName: string,
  fieldName: string,
};

type Prisma = {
  query: {},
  mutation: {},
  exists: () => mixed,
  request: () => mixed,
};

type AuthResolverFunction = (data: {}, ctx: AuthContext) => Promise<boolean>;
type AuthResolver =
  | boolean
  | string
  | AuthResolverFunction
  | { [string]: AuthResolver };

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
