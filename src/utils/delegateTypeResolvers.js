//@flow
import type { DocumentNode } from 'graphql';
import type { AuthPermissions } from './types';
import { identity } from 'lodash';

const open = () => true;

// these functions will be called with the type name
// to determine rules for access on associated types
const delegatingTypeRules = {
  // metadata only
  Connection: open,
  Edge: open,
  OrderByInput: open,

  // subscriptions
  PreviousValues: identity,
  SubscriptionPayload: typeName => ({
    mutation: true,
    node: typeName,
    updatedFields: true,
    previousValues: `${typeName}PreviousValues`,
  }),
  SubscriptionWhereInput: typeName => ({
    AND: `${typeName}SubscriptionWhereInput`,
    OR: `${typeName}SubscriptionWhereInput`,
    mutation_in: true,
    updatedFields_contains: true,
    updatedFields_contains_every: true,
    updatedFields_contains_some: true,
    node: `${typeName}WhereInput`,
  }),

  // modifiers: enforce model rules on inputs that
  // modify fields. Delegate to WhereUniqueInput where
  // relevant
  CreateInput: identity,
  CreateOneInput: typeName => ({
    create: typeName,
    connect: `${typeName}WhereUniqueInput`,
  }),
  UpdateInput: identity,
  UpdateOneInput: typeName => ({
    create: typeName,
    connect: `${typeName}WhereUniqueInput`,
    disconnect: `${typeName}WhereUniqueInput`,
    delete: `${typeName}WhereUniqueInput`,
  }),

  // where accessors: open. It's up to the user's API
  // to thoughtfully apply these since they are used
  // so frequently for a variety of purposes. Don't
  // allow your API users to manually specify a direct
  // value, or be sure to authorize the returned values
  // with a read permission that's restrictive to what
  // can be accessed.
  WhereInput: open,
  WhereUniqueInput: open,
};

export default (typeName: string): AuthPermissions =>
  Object.keys(delegatingTypeRules).reduce((delegatingMap, typeSuffix) => {
    const rules = delegatingTypeRules[typeSuffix](typeName);
    return {
      ...delegatingMap,
      [`${typeName}${typeSuffix}`]: {
        read: rules,
        write: rules,
      },
    };
  }, {});
