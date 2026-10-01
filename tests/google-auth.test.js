import test from 'node:test';
import assert from 'node:assert/strict';
import { google } from 'googleapis';
import { getAuth } from '../netlify/functions/_auth.js';

test('owner OAuth is used for invitations and availability without a live token exchange', () => {
  const env = { GOOGLE_OAUTH_CLIENT_ID: 'example-client', GOOGLE_OAUTH_CLIENT_SECRET: 'example-secret', GOOGLE_OAUTH_REFRESH_TOKEN: 'example-token' };
  for (const requireInvitations of [false, true]) {
    const auth = getAuth({ env, requireInvitations });
    assert.ok(auth instanceof google.auth.OAuth2);
    assert.equal(auth.credentials.refresh_token, env.GOOGLE_OAUTH_REFRESH_TOKEN);
  }
});

test('missing or incomplete OAuth prevents personal Gmail bookings before Calendar writes', () => {
  for (const env of [{}, { GOOGLE_CLIENT_EMAIL: 'example', GOOGLE_PRIVATE_KEY: 'example' }, { GOOGLE_OAUTH_CLIENT_ID: 'example' }]) {
    assert.throws(() => getAuth({ env, requireInvitations: true }), error => error.message === 'booking_invitations_unavailable' && error.status === 503);
  }
});

test('service account remains available for read-only availability during migration', () => {
  const auth = getAuth({ env: { GOOGLE_CLIENT_EMAIL: 'example', GOOGLE_PRIVATE_KEY: 'example' } });
  assert.ok(auth instanceof google.auth.JWT);
});
