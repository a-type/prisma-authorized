import getModelTypeNames from './getModelTypeNames';
import resolveTypeDefs from './resolveTypeDefs';
import path from 'path';

describe('getModelTypeNames', () => {
  test('gets type names of model types', () => {
    const typeDefs = resolveTypeDefs(
      path.resolve(__dirname, '../__fixtures__/prisma.graphql'),
    );
    expect(getModelTypeNames(typeDefs)).toEqual([
      'OtherThing',
      'Thing',
      'User',
    ]);
  });
});
