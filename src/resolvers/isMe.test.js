import isMe from './isMe';

describe('isMe resolver', () => {
  const ctx = { user: { id: 'foo' }, typeName: 'User' };

  describe('default config', () => {
    const check = isMe();
    test('match', () => {
      const result = { id: 'foo' };
      expect(check(result, ctx)).resolves.toBe(true);
    });
    test('no match', () => {
      const result = { id: 'bar' };
      expect(check(result, ctx)).resolves.toBe(false);
    });
  });
  describe('custom id path', () => {
    const check = isMe({ userIdPath: 'user.id' });
    test('match', () => {
      const result = { user: { id: 'foo' } };
      expect(check(result, ctx)).resolves.toBe(true);
    });
    test('no match', () => {
      const result = { user: { id: 'bar' } };
      expect(check(result, ctx)).resolves.toBe(false);
    });
  });
});
