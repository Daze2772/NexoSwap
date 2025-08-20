import argon2 from 'argon2';

describe('Password hashing with Argon2', () => {
  test('hash and verify password', async () => {
    const password = 'SecretPass123!';
    const hash = await argon2.hash(password);
    const match = await argon2.verify(hash, password);
    expect(match).toBe(true);
  });
});