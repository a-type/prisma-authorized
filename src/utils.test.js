import { mapPromiseValues } from './utils';

describe('utils', () => {
  test('mapPromiseValues', async () => {
    expect(
      await mapPromiseValues({
        foo: Promise.resolve('bar'),
        baz: Promise.resolve(true),
      }),
    ).toEqual({ foo: 'bar', baz: true });
  });
});
