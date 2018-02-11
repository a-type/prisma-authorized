import mapPromiseValues from './mapPromiseValues';

describe('mapPromiseValues', () => {
  test('maps', async () => {
    expect(
      await mapPromiseValues({
        foo: Promise.resolve('bar'),
        baz: Promise.resolve(true),
      }),
    ).toEqual({ foo: 'bar', baz: true });
  });
});
