// netlify/functions/_auth.js
import { google } from 'googleapis';
import fs from 'node:fs';
import path from 'node:path';

export const CALENDAR_SCOPES = Object.freeze([
  'https://www.googleapis.com/auth/calendar.events',
  'https://www.googleapis.com/auth/calendar.events.freebusy',
]);

function normalizeKey(key) {
  if (!key) return '';
  return key.includes('\\n') ? key.replace(/\\n/g, '\n') : key;
}

export function getAuth() {
  // 1) Si hay ruta a archivo JSON
  const credPath = process.env.GOOGLE_APPLICATION_CREDENTIALS;
  if (credPath) {
    const abs = path.resolve(process.cwd(), credPath);
    const raw = fs.readFileSync(abs, 'utf8');
    const json = JSON.parse(raw);
    return new google.auth.JWT({
      email: json.client_email,
      key: normalizeKey(json.private_key),
      scopes: CALENDAR_SCOPES,
    });
  }

  // 2) Si hay par suelto en env
  const email = process.env.GOOGLE_CLIENT_EMAIL;
  const key = normalizeKey(process.env.GOOGLE_PRIVATE_KEY);
  if (email && key) {
    return new google.auth.JWT({
      email,
      key,
      scopes: CALENDAR_SCOPES,
    });
  }

  throw new Error('No credentials set (GOOGLE_APPLICATION_CREDENTIALS or CLIENT_EMAIL + PRIVATE_KEY)');
}
