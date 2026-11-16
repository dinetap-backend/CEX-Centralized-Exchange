import assert from 'node:assert/strict';
import test from 'node:test';

import { loginUser, registerUser } from './authService';

test('registerUser creates a valid user and token', async () => {
  const created = await registerUser({
    name: 'Alice',
    email: 'alice@example.com',
    password: 'SecurePass123',
  });

  assert.equal(created.user.email, 'alice@example.com');
  assert.ok(created.token.length > 20);
});

test('loginUser accepts the correct password', async () => {
  await registerUser({
    name: 'Bob',
    email: 'bob@example.com',
    password: 'StrongPass456',
  });

  const result = await loginUser({
    email: 'bob@example.com',
    password: 'StrongPass456',
  });

  assert.equal(result.user.email, 'bob@example.com');
  assert.ok(result.token.length > 20);
});
