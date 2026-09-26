# Booking calendar

## Schedule

The canonical policy is `src/shared/booking-policy.js`, shared by the browser and Netlify handlers:

- Host zone: `America/Hermosillo` (independent of visitor, server and DEFAULT_TZ).
- Monday–Friday, 07:00–13:00 and 14:00–16:00.
- Starts every 15 minutes; durations 15, 30, 45 or 60 minutes.
- Earliest date is the next business day in Hermosillo; same-day appointments are rejected.
- The entire appointment must fit within one window; past starts are rejected.
- The UI displays host time explicitly. Requests and Google events use UTC instants plus the IANA host zone.

## API

POST `/.netlify/functions/freebusy` with `{ "date": "2026-10-05", "duration": 30 }` returns `{ slots: [{time,start,end}], tz }`. Busy ranges remain on the server. The UI refreshes when the date/duration changes and ignores stale requests.

POST `/.netlify/functions/create-event` with `name`, `email`, `when` (RFC3339 with explicit offset or Z), `duration`, optional `subject`, `location`, `hp`. The server revalidates the schedule and queries Google immediately before insertion. Missing/failed calendar availability fails closed. Internal exceptions and credentials are not returned.

Deploy the frontend and both functions together: the availability API contract changed. Old timezone-less booking requests are rejected rather than interpreted incorrectly.

## Local verification

Use Node 24.18.0 (see `.nvmrc`). Run `nvm use` before starting development. Netlify CLI 21.6.0 contains a transitive dependency on SlowBuffer that crashes on Node 25+; the predev check provides an actionable message.

```sh
node --test tests/booking.test.js
TZ=UTC node --test tests/booking.test.js
TZ=Asia/Tokyo node --test tests/booking.test.js
npm run build
```

Tests inject a fake Calendar client; no credentials, events or emails are used. For actual local integration use `npm run dev` (or `npm run dev:netlify`) at port 8888, not the standalone Webpack port 5173. Function URLs are same-origin.

Existing GOOGLE_CALENDAR_ID and the existing Google authentication method are still required for real integration. Changing DEFAULT_TZ is not necessary for these two handlers. `_google-common.js` and diagnostic endpoints are outside this fix.

## Verification before deployment

- In an isolated test calendar, confirm existing busy and all-day events disappear from availability.
- Confirm one event at the chosen Hermosillo time and check the returned Meet link.
- Test calendar permission failures: they must block booking.
- Confirm Google service-account/Meet capabilities for the deployed account.

## Remaining limitations

- Availability checks and Calendar insertion are not an atomic transaction. Two different visitors booking overlapping slots simultaneously can still race. A shared transactional reservation store/lock is needed for a strict concurrency guarantee; an in-memory serverless lock would not provide one.
- The UI blocks double-click submission and repeated submission after success; it does not implement durable server-side idempotency.
- Visitor email is recorded in the event description. Invitation/confirmation email delivery is not added by this change and must be implemented/tested separately.
- Only GOOGLE_CALENDAR_ID is checked. Other calendars require an explicit configuration/design change.
- No production deployment or real booking was performed in this change.

The time selector is a scroll-snap wheel of complete available times. Scroll, click or keyboard arrows update the same selected instant used for booking. `npm run dev:web` runs only Webpack and cannot serve Calendar functions. Stop an existing standalone Webpack process before starting the full stack.
