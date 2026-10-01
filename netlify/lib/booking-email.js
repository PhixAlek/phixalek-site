import { TIME_ZONE } from '../../src/shared/booking-policy.js';

const escape = value => String(value).replace(/[&<>"']/g, character => ({
  '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;',
})[character]);

function safeUrl(value) {
  if (typeof value !== 'string' || !value.trim()) return null;
  try {
    const url = new URL(value);
    return url.protocol === 'https:' && !url.username && !url.password ? url.href : null;
  } catch { return null; }
}

// Rendering only: this module does not send mail or change Calendar invitations.
// start, tz, meet and htmlLink follow the booking response's existing names.
export function renderBookingEmail({ name, start, tz = TIME_ZONE, duration, meet, htmlLink, cancelUrl, rescheduleUrl } = {}) {
  const details = [];
  if (start) {
    // An explicit offset prevents server-local time from changing the appointment.
    if (typeof start !== 'string' || !/(?:Z|[+-]\d{2}:\d{2})$/i.test(start) || !Number.isFinite(Date.parse(start))) {
      throw new TypeError('Booking start must include a valid date, time and offset');
    }
    const date = new Date(start);
    const day = new Intl.DateTimeFormat('en-US', { timeZone: tz, weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' }).format(date);
    const time = new Intl.DateTimeFormat('en-US', { timeZone: tz, hour: 'numeric', minute: '2-digit', timeZoneName: 'longOffset' }).format(date);
    details.push(['Date and time', `${day} · ${time} (${tz})`]);
  }
  if (typeof duration === 'number' && Number.isFinite(duration) && duration > 0) details.push(['Duration', `${duration} minutes`]);

  const meeting = safeUrl(meet), calendar = safeUrl(htmlLink);
  const cancel = safeUrl(cancelUrl), reschedule = safeUrl(rescheduleUrl);
  const link = (url, label) => `<a href="${escape(url)}" style="color:#756397;text-decoration:underline;">${label}</a>`;
  const rows = details.map(([label, value]) => `<tr><td style="padding:0 0 16px;"><p style="margin:0 0 6px;font-size:13px;color:#626270;">${label}</p><p style="margin:0;font-size:16px;line-height:1.6;color:#292933;">${escape(value)}</p></td></tr>`).join('');
  const optionalLinks = [calendar && link(calendar, 'View in Calendar'), cancel && link(cancel, 'Cancel booking'), reschedule && link(reschedule, 'Reschedule')].filter(Boolean);
  const greeting = name ? `Hi ${escape(name)},` : 'Hi,';
  const html = `<!doctype html>
<html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1"><title>Your call is booked — Pixalek</title></head>
<body style="margin:0;padding:0;background-color:#f7f7fa;font-family:Arial,Helvetica,sans-serif;color:#292933;">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background-color:#f7f7fa;"><tr><td align="center" style="padding:32px 16px;">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="width:100%;max-width:600px;background-color:#ffffff;border:1px solid #e9e7ef;border-radius:16px;"><tr><td style="padding:32px;">
<p style="margin:0 0 28px;font-size:14px;font-weight:bold;letter-spacing:2px;color:#9b8ac4;">Pixalek</p>
<h1 style="margin:0 0 24px;font-size:26px;line-height:1.3;font-weight:600;">Your call is booked</h1>
<p style="margin:0 0 12px;font-size:16px;line-height:1.6;">${greeting}</p>
<p style="margin:0 0 24px;font-size:16px;line-height:1.6;">Your call with Alejandro is confirmed.</p>
${rows ? `<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="border-top:1px solid #e9e7ef;"><tr><td style="padding-top:20px;"><table role="presentation" width="100%" cellpadding="0" cellspacing="0">${rows}</table></td></tr></table>` : ''}
${meeting ? `<table role="presentation" cellpadding="0" cellspacing="0" style="margin:8px 0 24px;"><tr><td bgcolor="#9b8ac4" style="border-radius:8px;"><a href="${escape(meeting)}" style="display:inline-block;padding:14px 24px;border:1px solid #9b8ac4;border-radius:8px;color:#ffffff;font-size:16px;font-weight:bold;text-decoration:none;">Join the call</a></td></tr></table>` : ''}
${optionalLinks.length ? `<p style="margin:0 0 28px;font-size:14px;line-height:1.8;">${optionalLinks.join('<br>')}</p>` : ''}
<p style="margin:0 0 24px;font-size:16px;line-height:1.6;">Looking forward to speaking with you.</p>
<p style="margin:0;font-size:16px;line-height:1.6;">Alejandro Segura<br><span style="font-size:14px;color:#626270;">Software Developer · Pixalek</span></p>
</td></tr></table></td></tr></table></body></html>`;
  return { subject: 'Your call is booked — Pixalek', html };
}
