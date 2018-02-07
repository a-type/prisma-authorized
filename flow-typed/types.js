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
};

type AuthResolver =
  | boolean
  | string
  | ((args, RunFunction, Context) => Promise<boolean>);

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
