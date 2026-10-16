import { BookingError } from '../../src/shared/booking-policy.js';

export const JSON_HEADERS = Object.freeze({
  'Content-Type': 'application/json; charset=utf-8', 'Cache-Control': 'no-store',
  'X-Content-Type-Options': 'nosniff', 'Referrer-Policy': 'no-referrer',
});
export const MAX_REQUEST_BYTES = 8192;
export function allowedBookingOrigins() {
  const origins = new Set(['https://phixalek.com', 'https://www.phixalek.com', 'https://phixalek.netlify.app', 'https://dev--phixalek.netlify.app']);
  for (const value of [process.env.URL, process.env.DEPLOY_PRIME_URL]) {
    try { const url = new URL(value); if (url.protocol === 'https:' && !url.username && !url.password) origins.add(url.origin); } catch { /* Unconfigured deploy origin. */ }
  }
  if (process.env.NETLIFY_DEV === 'true' || process.env.NODE_ENV === 'development') {
    for (const host of ['localhost', '127.0.0.1']) for (const port of [5173, 8888]) origins.add(`http://${host}:${port}`);
  }
  return origins;
}
/** Browser-origin checks reduce cross-site abuse; they are not authentication for this public API. */
export function parseBookingRequest(event, origins = allowedBookingOrigins()) {
  if (event.httpMethod !== 'POST') throw new BookingError('method_not_allowed', 405);
  const headers = Object.fromEntries(Object.entries(event.headers || {}).map(([key, value]) => [key.toLowerCase(), value]));
  if (!/^application\/json(?:\s*;|$)/i.test(headers['content-type'] || '')) throw new BookingError('unsupported_media_type', 415);
  if (headers['sec-fetch-site'] === 'cross-site') throw new BookingError('origin_not_allowed', 403);
  if (headers.origin && !origins.has(headers.origin)) throw new BookingError('origin_not_allowed', 403);
  if (typeof event.body !== 'string' || event.isBase64Encoded) throw new BookingError('invalid_json');
  if (Buffer.byteLength(event.body, 'utf8') > MAX_REQUEST_BYTES || Number(headers['content-length']) > MAX_REQUEST_BYTES) throw new BookingError('request_too_large', 413);
  let data; try { data = JSON.parse(event.body); } catch { throw new BookingError('invalid_json'); }
  if (!data || Array.isArray(data) || typeof data !== 'object') throw new BookingError('invalid_json');
  return data;
}
export function logSecurityEvent(event) {
  // Never log names, email addresses, request bodies, IPs, tokens or upstream exception text.
  console.warn(JSON.stringify({ event: event.event, code: event.code, status: event.status }));
}

/** Preserve the tested booking contract on Netlify's Request/Response API. */
export function adaptBookingHandler(handler) {
  return async request => {
    const chunks = [];
    let size = 0;
    const reader = request.body?.getReader();
    if (reader) {
      try {
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;
          size += value.byteLength;
          if (size > MAX_REQUEST_BYTES) { await reader.cancel(); break; }
          chunks.push(value);
        }
      } catch {
        return new Response(JSON.stringify({ error: 'invalid_json' }), { status: 400, headers: JSON_HEADERS });
      } finally { reader.releaseLock(); }
    }
    const result = await handler({
      httpMethod: request.method, headers: Object.fromEntries(request.headers),
      body: size > MAX_REQUEST_BYTES ? 'x'.repeat(MAX_REQUEST_BYTES + 1) : Buffer.concat(chunks).toString('utf8'),
    });
    return new Response(result.body, { status: result.statusCode, headers: result.headers });
  };
}
