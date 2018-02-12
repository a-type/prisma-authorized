# prisma-authorized

An authorization wrapper for [`prisma-binding`](https://github.com/graphcool/prisma-binding). Provide rules for the access of your models with field-level granularity, and this library will generate a copy of your Prisma object which enforces those rules based on the user you provide.

**Features:**

* Define granular and powerful permission resolvers for each field in your GraphQL type.
* `write` and `read` permissions which are checked against input values and query result data, respectively.
* Use functions to compute advanced permission scenarios based on data values, GraphQL context and more.
* Delegate fields or whole types to other types by name to easily define type relationships and replicate permissions across similar scenarios.
* Out-of-the-box support for roles and role inheritance.
* Memoization of permission definitions based on user role.
* Automated generation of sensible permissions for Prisma derived types (like `XWhereUniqueInput`, `XCreateInput`, etc)

Example:

```js
const permissionMap = {
  ANONYMOUS: {
    permissions: {
      User: {
        read: {
          id: true,
          name: true,
        },
        write: {},
      },
      Thing: {
        read: {
          id: true,
          foo: true,
          user: 'User',
        },
        write: {},
      },
    },
  },
  USER: {
    inherits: 'ANONYMOUS',
    permissions: {
      User: {
        read: {
          email: isMe(),
        },
        write: {
          name: isMe(),
        },
      },
      Thing: {
        read: {
          foo: true,
          bar: isMine('Thing'),
        },
        write: {
          foo: true,
        },
      },
    },
  },
};

const prisma = /* create prisma-binding */
const authorized = new Authorized({
  prisma,
  typeDefs, // same as what you pass to Prisma
  permissionMapProvider: new StaticPermissionMapProvider(
    permissionMap,
    {
      generateDerivedPermissions: ['User', 'Thing'],
    },
  ),
});

// in your GraphQL context for each request:
const user = /* determine the authenticated user */
const authorizedForUser = authorized.forUser(user);
```

This library is an **experiment** in writing authorization around a GraphQL binding instead of relying on service-layer permissions.

Since this is dealing with securing your data, though, *caveat emptor*. Be sure to test your API to ensure that the permissions model you defined achieves your authorization goals. And if you find a problem with the library itself, please open a PR to fix it or provide a detailed issue with reproduction steps!

## Docs

### Generic permissions tools

**`Authorized`**

A class that wraps `Prisma` and rewrites its `mutation` / `query` bindings to check for permissions.

*Constructor args*

```js
options: {
  prisma: Prisma,
  typeDefs: DocumentNode | string,
  permissionMapProvider: PermissionMapProvider,
}
```

* `prisma`: A `Prisma` object constructed via `prisma-binding`.
* `typeDefs`: A fully parsed graphql `DocumentNode`, a full string schema, or a string path pointing to a `.graphql` schema file. You can pass whatever you passed to `Prisma`.
* `permissionMapProvider`: a provider class instance which will define permissions according to the authenticated user. See documentation below.

*Methods*

```js
forUser(user: User): AuthorizedPrisma
```

Pass this function a user, and it returns a pseudo-Prisma which contains only fully mapped versions of `query` and `mutation`. These cloned functions will apply authorization rules to the queries run by them according to the user you provided.

Currently, a user must, at minimum, define an `id` and `role` property. These requirements may relax as this library matures a bit.

**`PermissionMapProvider`**

This is an *interface* which defines a class which can provide permission rules for a particular user. A `PermissionMapProvider` must have one method:

```js
getUserPermissions(user: User): PermissionQueue
```

It must return a `PermissionQueue`: an array of `RolePermissions` for the user. It might look like this:

```js
[
  {
    User: {
      read: {
        email: true,
      },
      write: {
        email: true,
      },
    },
  },
  {
    User: {
      read: {
        id: true,
        name: true,
      },
      write: {},
    },
  },
]
```

In a `PermissionQueue`, you list maps of model permission definitions in order of priority. The first item in the list should be the highest priority (for instance, the permissions for the user's assigned role), and the last should be lowest priority (for instance, permissions given to all anonymous users). The permissions checker will run through your provided permission definitions in order, checking each field against each one until it gets a definite permission value (true or false), or it runs out of options (defaulting to false).


### Built-in static permissions provider

**`StaticPermissionMapProvider`**

An implementation of `PermissionMapProvider` which uses a statically defined, role-based permission map. Optionally, it can provide some basic permissions for Prisma derived types like `XCreateInput` or `XWhereUniqueInput`, etc.

*Constructor args*

```js
staticPermissionMap: PermissionMap,
options: {
  generateDerivedPermissions: Array<string>,
},
```

* `staticPermissionMap`: a `PermissionMap` (see below for spec) which defines permissions for roles.
* `options.generateDerivedPermissions`: an array of type names which you would like to automatically assign some basic derived type permissions for.

See `/src/utils/delegateTypeResolvers.js` for details about how derived type permissions are generated.

**`PermissionMap`**

A `PermissionMap` is a map of roles to permissions which is provided to a `StaticPermissionMapProvider`. It looks like this:

```js
{
  ANONYMOUS: {
    permissions: {
      User: {
        read: {
          id: true,
          name: true,
        },
        write: {},
      },
      Thing: {
        read: {
          id: true,
          foo: true,
          user: 'User',
        },
        write: {},
      },
    },
  },
  USER: {
    inherits: 'ANONYMOUS',
    permissions: {
      User: {
        read: {
          email: isMe(),
        },
        write: {
          name: isMe(),
        },
      },
      Thing: {
        read: {
          foo: true,
          bar: isMine('Thing'),
        },
        write: {
          foo: true,
        },
      },
    },
  },
}
```

It's structured with the following levels:

```js
{
  roleName: {
    inherits: 'anotherRoleName',
    permissions: {
      typeName: {
        read: {
          fieldName: PermissionResolver,
        },
        write: {
          fieldName: PermissionResolver,
        },
      },
    },
  },
}
```

A `PermissionResolver` can be one of the following:

* a boolean value; `true` means access is allowed.
* a string value; the value must correspond to a GraphQL type which you want this field to 'act as'. For instance, if type `Thing` has a `user` field, you may want to treat this field like any other `User` accessed by the authenticated user; you can do this by providing `User` as the `PermissionResolver`.
* an object value, where keys are field names and values are `PermissionResolver`s (recursion). This is used to define deeper sub-field permissions.
* an `async` function. This function will be called with the following argument:

```js
{
  fieldValue: mixed,
  fieldName: ?string,
  fieldPath: string,
  typeValue: {},
  typeName: string,
  context: {
    user: User,
    prisma: Prisma,
    graphqlContext: {}, 
  },
}
```

Use these values to return a promise any of the above `PermissionResolver` types (boolean, string, or object). (That is, if you've defined your function as `async`, you just return the value. Otherwise, return a promise to resolve that value).

### Built-in permission resolver functions

**`isMe({ userIdPath: string = 'id', userTypeName: string = 'User' })`**

Checks to see if the currently evaluated type is the authenticated user by comparing its `id` to the user's `id`. Also works on `update` and `delete` mutations by checking to see if the provided `UserWhereUniqueInput` matches its `id` field to the authenticated user's `id`.

Allows customizing some of the parameters used to calculate access.

**`isMine({ relationshipPath: string = 'user.id', resourceIdPath: string = 'id' })`**

Checks to see if the currently evaluated type belongs to the authenticated user by comparing the value of the `relationshipPath` within the data to the `id` of the user. If the `relationshipPath` is not included in the provided data (for instance, if you are modifying a single field on a model update), it will query the resource by `id` and fetch its associated user to determine if the ownership is correct.

## What this library doesn't cover

This library probably doesn't cover a lot of things, but here are some aspects that are either purposefully omitted or omitted for the sake of getting something working quickly:

* **Does not authorize connecting models to other models.** This library is focused on streamlining the effort of authorizing operations which utilize data provided by the user to your API. Generally, it's assumed that connection operations will be part of your resolver business logic. For instance, if you want to connect a new Post to a User when it's created, you'll probably be fetching the authenticated user's ID from a token and providing it to a `user: { connect: { where: id } }` fragment that you will add to the query. This library assumes you know what you're doing when you create those connections and does not authorize them at all by default. *This should be fine as long as you do not expose the connection inputs through your API*.
* **Does not provide any dynamic permissions support.** You're free to implement your own PermissionMapProvider which will provide dynamically loaded permissions (for instance, from the database or LDAP or something like that). Please open a PR if the design of the library prevents a desired implementation.
* **Does not cover `exists` or `request`.** If you're running ad-hoc queries, it's probably best to implement your own permissions logic anyway. But, perhaps the library could be extended to parse arbitrary query documents and apply existing permissions models.
* **Does not do subscriptions.** Or at least, I haven't tested anything to do with subscriptions. I haven't implemented subscriptions in a GraphQL app yet, so I'm not entirely sure how to work or how the authorization in this library would be applied to them. PRs welcome.

## Aren't you not supposed to do this?

If you visit [http://graphql.org/learn/authorization/](http://graphql.org/learn/authorization/) at the time of writing, you'll see a very curt recommendation to not attempt to authorize GraphQL data access at the graph layer. It makes sense. The creators of GraphQL recommend you authorize data access at a lower, service layer. Trying to authorize a graph is a headache... I should know by now!

The problem is, Prisma *is* our service layer, and it's *also* a GraphQL API. Right now, there's not a great way to build authorization into a Prisma-powered app. When I began working with Prisma, I noticed that I was beginning to try to sandwich authorization ad-hoc into my resolvers. That's not maintainable long term, so I decided to experiment with this project.

Perhaps in the future, Prisma will introduce an authorization configuration which it could enforce closer to the database layer.
