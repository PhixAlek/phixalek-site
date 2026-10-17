import { logSecurityEvent, adaptBookingHandler } from '../lib/security.js';
import { google } from 'googleapis';
import { getAuth } from './_auth.js';
import { createBookingHandlers } from '../lib/booking.js';

const handler = createBookingHandlers({
  getCalendar: () => google.calendar({ version: 'v3', auth: getAuth() }),
  getCalendarId: () => process.env.GOOGLE_CALENDAR_ID,
  log: logSecurityEvent,
}).availability;

export default adaptBookingHandler(handler);

export const config = {
  path: '/.netlify/functions/freebusy',
  rateLimit: { windowLimit: 30, windowSize: 60, aggregateBy: ['ip', 'domain'] },
};
