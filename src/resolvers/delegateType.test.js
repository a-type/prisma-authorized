//@flow
import delegateType from './delegateType';

describe('delegateType resolver', () => {
  const ctx = {
    fieldName: 'foo',
    typeName: 'Thing',
    user: { id: 'userA', role: 'Some_role' },
    prisma: { mutation: {}, query: {}, request: jest.fn(), exists: jest.fn() },
    dataRoot: {},
  };

  test('matching condition', () => {
    const resolver = delegateType('SomeType', () => Promise.resolve(true));
    expect(resolver({}, ctx)).resolves.toEqual('SomeType');
  });
  test('fallback value', () => {
    const resolver = delegateType(
      'SomeType',
      () => Promise.resolve(false),
      'SomeOtherType',
    );
    expect(resolver({}, ctx)).resolves.toEqual('SomeOtherType');
  });
});
