# How this portfolio works

The site is a JavaScript application built with Webpack and deployed on Netlify. Small DOM components render the header, sections and footer. JSON keeps editable content separate from presentation.

## Contact messages

The contact form uses EmailJS in the browser to send a message through a configured service and template. Its public identifiers are injected during the build. Google Calendar credentials are not used by this form.

## Call booking

The browser requests available slots from a Netlify Function. The function queries Google Calendar and filters slots using the shared booking policy. When a visitor submits a booking, the server validates the request and checks availability again before creating the event.

Appointments use America/Hermosillo, weekdays from 07:00 to 16:00 with a 13:00–14:00 lunch break. Booking starts on the next business day. Durations are 15, 30, 45 or 60 minutes.

Google credentials remain in server configuration. The browser receives available times and booking results, not private credentials.

Creating an event currently does not send an attendee invitation. Availability checking and insertion are not atomic; concurrent bookings and durable retry protection remain future work. See [calendar implementation and limits](CALENDAR.md).

## Content and verification

The content adapter supplies JSON data and interface messages to components. Draft sections are kept out of the rendered page. Validation checks destinations, required content and translation placeholders before builds.

- `npm run validate:content`: validate content models.
- `npm test`: test content contracts and booking rules with simulated providers.
- `npm run build`: validate content and compile the site.
- `npm run dev`: run the frontend and Netlify Functions together.

See [content editing guide](CONTENT.md) for the current content structure. Automated tests do not establish real email delivery or Google account configuration; those require separate integration checks.
