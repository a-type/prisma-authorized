type User = {
  userId: string,
  role: string,
};

type RunFunction = () => {};

type Context = {
  user: User,
  prisma: Prisma,
};

type Prisma = {
  query: {},
  mutation: {},
  exists: () => mixed,
  request: () => mixed,
};

type AuthResolverFunction = (args: {}, ctx: Context) => Promise<boolean>;
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
