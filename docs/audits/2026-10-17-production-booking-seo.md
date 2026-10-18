# Production review: booking latency, SEO and documentation

## Observed in production

- Home, Writing and all three sitemap articles returned HTTP 200 with matching canonical, title, description and og:url. `npm run seo:live` reported no errors.
- robots.txt declares https://phixalek.com/sitemap.xml; sitemap returns XML with five URLs.
- `/blog/missing-check-20261017/` returned a real HTTP 404.
- Browser booking modal opened, date selection for 2026-10-19 returned the available-time list. No console error appeared during this check. No reservation was submitted.
- Two additional read-only free/busy requests returned HTTP 200 and 30 slots, in approximately 1.11s and 1.18s end-to-end. This sample does not establish cold-start behavior, mobile performance or the cause of the reported intermittent failure.
- Production Documentation still links to an old branch. Local data now targets `main/docs/ARCHITECTURE.md` in both languages.

The user confirmed the intermittent error occurs when choosing a date, before submitting a booking.

## Confirmed code issues and changes

- Fresh JWT clients per invocation discarded warm token reuse. Reuse the client within each warm function instance; the Google library retains responsibility for token refresh.
- Availability and booking fetches could wait indefinitely. Add browser time limits and explicit provider HTTP timeouts without automatically retrying insertion.
- Add private, allowlisted diagnostic codes for Calendar access denial, missing calendar, timeouts, rate limits and transport failures. No upstream exception text, calendar IDs or request bodies are logged.
- Rate limiting and provider errors were conflated with generic availability/reservation messages. Keep distinct rate-limit, slow-calendar, occupied-slot and uncertain-booking states.
- Google insertion transport/malformed responses previously looked like ordinary Calendar failures. Return `booking_unconfirmed`; never automatically retry event creation after an uncertain result.
- Add a read-only production SEO command and Search Console/new-post runbook. No deploy is triggered by the audit.

## Validation and limits

- Automated tests use fake credentials/providers and never create Google events.
- The real event creation path was not exercised. If the reported failure occurs at submit rather than date selection, inspect Netlify logs for the timestamp, function status and Calendar/Meet permissions in an isolated test calendar.
- Reusing authentication cannot remove first-instance cold starts or upstream outages. Timing out the browser cannot cancel an insertion already accepted by Google.
- Two simultaneous booking insertions still lack a shared transactional reservation lock/idempotency store; that pre-existing architectural limit is not solved by timeouts.
- Existing image-size warnings remain (consultoria-01.webp and finbit-01.webp). No visual assets, layout, Node version or dependency versions were changed.
- Search Console submission/indexing and Google-selected canonicals require access to the property and were not performed here.
- Git fetch via SSH failed because this session lacks an accepted key. Work remains on local dev; no remote merge confirmation, push or deploy was performed.
