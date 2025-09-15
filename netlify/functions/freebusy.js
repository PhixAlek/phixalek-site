import { google } from 'googleapis';
import { getAuth } from './_auth.js';

export async function handler(event) {
  try {
    if (event.httpMethod !== 'POST') {
      return { statusCode: 405, body: 'Method Not Allowed' };
    }

    let payload = {};
    try {
      payload = JSON.parse(event.body || '{}');
    } catch (e) {
      return { statusCode: 400, body: JSON.stringify({ error: 'invalid_json', detail: e.message }) };
    }

    const { start, end, tz = process.env.DEFAULT_TZ || 'America/Bogota' } = payload;
    const calendarId = process.env.GOOGLE_CALENDAR_ID;

    if (!calendarId) {
      return { statusCode: 500, body: JSON.stringify({ error: 'Missing GOOGLE_CALENDAR_ID' }) };
    }
    if (!start || !end) {
      return { statusCode: 400, body: JSON.stringify({ error: 'start/end required', got: { start, end } }) };
    }

    const auth = getAuth();
    const calendar = google.calendar({ version: 'v3', auth });

    const fb = await calendar.freebusy.query({
      requestBody: {
        timeMin: new Date(start).toISOString(),
        timeMax: new Date(end).toISOString(),
        timeZone: tz,
        items: [{ id: calendarId }],
      },
    });

    const busy = fb.data?.calendars?.[calendarId]?.busy || [];
    return { statusCode: 200, body: JSON.stringify({ ok: busy.length === 0, busy, tz }) };
  } catch (err) {
    // ⬅️ devolvemos detalle útil
    return {
      statusCode: 500,
      body: JSON.stringify({
        error: 'freebusy_failed',
        message: err?.message,
        response: err?.response?.data || null,
        stack: err?.stack?.split('\n').slice(0, 3).join('\n'),
      }),
    };
  }
}
