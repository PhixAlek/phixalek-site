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

    const calendarId = process.env.GOOGLE_CALENDAR_ID;
    if (!calendarId) {
      return { statusCode: 500, body: JSON.stringify({ error: 'Missing GOOGLE_CALENDAR_ID' }) };
    }

    const {
      name = '', email = '', when = '', duration = 30,
      subject = 'Intro call', location = 'Google Meet',
      tz = process.env.DEFAULT_TZ || 'America/Bogota', hp = ''
    } = payload;

    if (hp) return { statusCode: 200, body: JSON.stringify({ ok: true, spam: true }) };
    if (!name || !email || !when) {
      return { statusCode: 400, body: JSON.stringify({ error: 'Missing name/email/when', got: { name, email, when } }) };
    }

    // Acepta ISO con offset; si llega local sin offset, lo intenta parsear igual.
    const start = new Date(when);
    if (isNaN(start)) {
      return { statusCode: 400, body: JSON.stringify({ error: 'invalid_when', got: when }) };
    }
    const end = new Date(start.getTime() + Number(duration) * 60000);

    const auth = getAuth();
    const calendar = google.calendar({ version: 'v3', auth });

    // Freebusy defensivo
    const fb = await calendar.freebusy.query({
      requestBody: {
        timeMin: start.toISOString(),
        timeMax: end.toISOString(),
        timeZone: tz,
        items: [{ id: calendarId }],
      },
    });
    if ((fb.data?.calendars?.[calendarId]?.busy || []).length) {
      return { statusCode: 409, body: JSON.stringify({ error: 'slot_not_available' }) };
    }

    const ev = await calendar.events.insert({
      calendarId,
      conferenceDataVersion: 1,
      requestBody: {
        summary: `${subject} — ${name}`,
        description: `Intro call with ${name} <${email}>`,
        location,
        start: { dateTime: start.toISOString(), timeZone: tz },
        end:   { dateTime: end.toISOString(),   timeZone: tz },
        reminders: { useDefault: true },
        conferenceData: { createRequest: { requestId: `meet-${Date.now()}` } },
      },
    });

    const meet = ev.data?.hangoutLink
      || ev.data?.conferenceData?.entryPoints?.find(e => e.entryPointType === 'video')?.uri
      || null;

    return { statusCode: 200, body: JSON.stringify({ ok: true, meet, id: ev.data.id, htmlLink: ev.data.htmlLink }) };
  } catch (err) {
    return {
      statusCode: 500,
      body: JSON.stringify({
        error: 'create_event_failed',
        message: err?.message,
        response: err?.response?.data || null,
        stack: err?.stack?.split('\n').slice(0, 3).join('\n'),
      }),
    };
  }
}
