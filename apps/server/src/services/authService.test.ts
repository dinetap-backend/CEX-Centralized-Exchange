import assert from 'node:assert/strict';
import test from 'node:test';

import { loginUser, registerUser } from './authService';

const suffix = `${Date.now()}-${process.pid}`;

test('registerUser creates a valid user and token', async () => {
  const email = `alice-${suffix}@example.com`;
  const created = await registerUser({
    name: 'Alice',
    email,
    password: 'SecurePass123',
  });

  assert.equal(created.user.email, email);
  assert.ok(created.token.length > 20);
});

test('loginUser accepts the correct password', async () => {
  const email = `bob-${suffix}@example.com`;
  await registerUser({
    name: 'Bob',
    email,
    password: 'StrongPass456',
  });

  const result = await loginUser({
    email,
    password: 'StrongPass456',
  });

  assert.equal(result.user.email, email);
  assert.ok(result.token.length > 20);
});
