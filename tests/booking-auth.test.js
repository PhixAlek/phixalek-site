import test from 'node:test';
import assert from 'node:assert/strict';
import { getAuth } from '../netlify/functions/_auth.js';

test('warm function invocations reuse the JWT client and its refreshable credentials', () => {
  const keys = ['GOOGLE_APPLICATION_CREDENTIALS', 'GOOGLE_CLIENT_EMAIL', 'GOOGLE_PRIVATE_KEY'];
  const saved = keys.map(key => process.env[key]);
  try {
    delete process.env.GOOGLE_APPLICATION_CREDENTIALS;
    process.env.GOOGLE_CLIENT_EMAIL = 'fake@example.invalid';
    process.env.GOOGLE_PRIVATE_KEY = 'test-only-key';
    const first = getAuth();
    assert.equal(getAuth(), first);
    assert.equal(first.email, 'fake@example.invalid');
  } finally {
    keys.forEach((key, index) => saved[index] === undefined ? delete process.env[key] : process.env[key] = saved[index]);
  }
});
