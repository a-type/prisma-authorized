import toFragment from './toFragment';

describe('toFragment', () => {
  test('single name', () => {
    expect(toFragment('foo')).toEqual('{ foo }');
  });
  test('nested name', () => {
    expect(toFragment('foo.bar')).toEqual('{ foo: { bar } }');
  });
});
