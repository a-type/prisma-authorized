import isMe from './isMe';

describe('isMe resolver', () => {
  const context = { user: { id: 'foo' } };

  describe('default config', () => {
    const check = isMe();
    test('match', () => {
      const result = { id: 'foo' };
      expect(
        check({ typeValue: result, typeName: 'User', context }),
      ).resolves.toBe(true);
    });
    test('no match', () => {
      const result = { id: 'bar' };
      expect(
        check({ typeValue: result, typeName: 'User', context }),
      ).resolves.toBe(false);
    });
    test('without supplying id', () => {
      const result = { name: 'foo' };
      expect(
        check({ typeValue: result, typeName: 'User', context }),
      ).rejects.toThrow('include the id');
    });
  });
  describe('custom id path', () => {
    const check = isMe({ userIdPath: 'user.id' });
    test('match', () => {
      const result = { user: { id: 'foo' } };
      expect(
        check({ typeValue: result, typeName: 'User', context }),
      ).resolves.toBe(true);
    });
    test('no match', () => {
      const result = { user: { id: 'bar' } };
      expect(
        check({ typeValue: result, typeName: 'User', context }),
      ).resolves.toBe(false);
    });
  });

  test('on a non-user', () => {
    expect(isMe()({ typeName: 'Foo' })).rejects.toThrow('User type');
  });
});
