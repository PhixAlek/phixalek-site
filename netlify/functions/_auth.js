// netlify/functions/_auth.js
import { google } from 'googleapis';
import fs from 'node:fs';
import path from 'node:path';
import { BookingError } from '../../src/shared/booking-policy.js';

function normalizeKey(key) {
  if (!key) return '';
  return key.includes('\\n') ? key.replace(/\\n/g, '\n') : key;
}

export function getAuth({ requireInvitations = false, env = process.env } = {}) {
  const oauth = [env.GOOGLE_OAUTH_CLIENT_ID, env.GOOGLE_OAUTH_CLIENT_SECRET, env.GOOGLE_OAUTH_REFRESH_TOKEN];
  if (oauth.some(Boolean)) {
    if (!oauth.every(Boolean)) throw new BookingError('booking_invitations_unavailable', 503);
    const auth = new google.auth.OAuth2(oauth[0], oauth[1]);
    auth.setCredentials({ refresh_token: oauth[2] });
    return auth;
  }
  // A personal Gmail account cannot delegate attendee invitations to a service account.
  if (requireInvitations) throw new BookingError('booking_invitations_unavailable', 503);
  // 1) Si hay ruta a archivo JSON
  const credPath = env.GOOGLE_APPLICATION_CREDENTIALS;
  if (credPath) {
    const abs = path.resolve(process.cwd(), credPath);
    const raw = fs.readFileSync(abs, 'utf8');
    const json = JSON.parse(raw);
    return new google.auth.JWT({
      email: json.client_email,
      key: normalizeKey(json.private_key),
      scopes: ['https://www.googleapis.com/auth/calendar'],
    });
  }

  // 2) Si hay par suelto en env
  const email = env.GOOGLE_CLIENT_EMAIL;
  const key = normalizeKey(env.GOOGLE_PRIVATE_KEY);
  if (email && key) {
    return new google.auth.JWT({
      email,
      key,
      scopes: ['https://www.googleapis.com/auth/calendar'],
    });
  }

  throw new Error('No credentials set (GOOGLE_APPLICATION_CREDENTIALS or CLIENT_EMAIL + PRIVATE_KEY)');
}
