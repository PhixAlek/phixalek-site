import { google } from 'googleapis';
import { getAuth } from './_auth.js';
import { createBookingHandlers } from '../lib/booking.js';

export const handler = createBookingHandlers({
  getCalendar: () => google.calendar({ version: 'v3', auth: getAuth() }),
  getCalendarId: () => process.env.GOOGLE_CALENDAR_ID,
}).availability;
