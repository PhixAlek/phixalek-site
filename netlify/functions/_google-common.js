import { google } from 'googleapis';
import fs from 'fs';
import path from 'path';

function getPrivateKey(){
  let pk = process.env.GOOGLE_PRIVATE_KEY || '';
  const b64 = process.env.GOOGLE_PRIVATE_KEY_B64 || '';
  if (!pk && b64) {
    pk = Buffer.from(b64, 'base64').toString('utf8');
  } else {
    pk = pk.replace(/\\n/g, '\n');
  }
  return pk;
}

const decoded = getPrivateKey();
console.log('[PK length]', decoded.length);


export async function getAuth(scopes){
  const clientEmail = process.env.GOOGLE_CLIENT_EMAIL;
  const privateKey  = getPrivateKey();
  if (!clientEmail || !privateKey) throw new Error('Missing GOOGLE_CLIENT_EMAIL or GOOGLE_PRIVATE_KEY(_B64)');
  const auth = new google.auth.JWT(clientEmail, undefined, privateKey, scopes);
  await auth.authorize(); // fuerza a fallar si algo está mal
  return auth;
}

// Guardado simple del calendarId en dev (archivo en .netlify/tmp)
const cacheFile = path.join(process.cwd(), '.netlify', 'tmp', 'bookings_calendar_id.txt');

export function saveCalendarIdLocal(id){
  try {
    fs.mkdirSync(path.dirname(cacheFile), { recursive: true });
    fs.writeFileSync(cacheFile, id, 'utf8');
  } catch {}
}
export function readCalendarIdLocal(){
  try {
    if (fs.existsSync(cacheFile)) return fs.readFileSync(cacheFile, 'utf8').trim();
  } catch {}
  return '';
}

export async function ensureCalendar(auth){
  const calendar = google.calendar({ version: 'v3', auth });
  // 1) si hay GOOGLE_CALENDAR_ID, úsalo directamente
  const envId = (process.env.GOOGLE_CALENDAR_ID || '').trim();
  if (envId) return envId;

  // 2) si hay cache local (dev), úsalo
  const cached = readCalendarIdLocal();
  if (cached) return cached;

  // 3) buscar por summary
  const summary = process.env.BOOKINGS_CALENDAR_SUMMARY || 'Bookings';
  const list = await calendar.calendarList.list({ maxResults: 250 });
  const existing = (list.data.items || []).find(c => c.summary === summary);
  if (existing) {
    saveCalendarIdLocal(existing.id);
    return existing.id;
  }

  // 4) crearlo
  const created = await calendar.calendars.insert({
    requestBody: { summary, timeZone: process.env.DEFAULT_TZ || 'America/Bogota' }
  });
  const newId = created.data.id;
  if (!newId) throw new Error('Failed to create calendar');
  // agregarlo al listado del owner (service account)
  await calendar.calendarList.insert({
    requestBody: { id: newId, selected: true }
  });
  saveCalendarIdLocal(newId);
  return newId;
}
