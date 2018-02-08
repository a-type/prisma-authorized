import { mapPromiseValues, toFragment } from './utils';

describe('utils', () => {
  test('mapPromiseValues', async () => {
    expect(
      await mapPromiseValues({
        foo: Promise.resolve('bar'),
        baz: Promise.resolve(true),
      }),
    ).toEqual({ foo: 'bar', baz: true });
  });

  describe('toFragment', () => {
    test('single name', () => {
      expect(toFragment('foo')).toEqual('{ foo }');
    });
    test('nested name', () => {
      expect(toFragment('foo.bar')).toEqual('{ foo: { bar } }');
    });
  });
});
