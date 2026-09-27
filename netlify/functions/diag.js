import { google } from 'googleapis';
import { getAuth } from './_auth.js';

export async function handler() {
  try {
    const calendarId = process.env.GOOGLE_CALENDAR_ID || '(missing)';
    const tz = process.env.DEFAULT_TZ || 'America/Bogota';

    const auth = getAuth();
    await auth.authorize();

    const calendar = google.calendar({ version: 'v3', auth });
    const start = new Date();
    const end = new Date(start.getTime() + 15 * 60000);

    const fb = await calendar.freebusy.query({
      requestBody: {
        timeMin: start.toISOString(),
        timeMax: end.toISOString(),
        timeZone: tz,
        items: [{ id: calendarId }],
      },
    });

    return {
      statusCode: 200,
      body: JSON.stringify({ ok: true, calendarId, result: fb.data?.calendars?.[calendarId] || null }),
    };
  } catch (err) {
    return {
      statusCode: 500,
      body: JSON.stringify({ ok: false, error: err?.message || 'diag failed', detail: err?.response?.data || null }),
    };
  }
}
