/** Bound calendar waits and preserve distinct transport, rate-limit and API failures. */
export async function bookingRequest(path, body, { signal, timeoutMs = 15000, fetchImpl = fetch } = {}) {
  const controller = new AbortController();
  const cancel = () => controller.abort();
  if (signal?.aborted) controller.abort();
  else signal?.addEventListener('abort', cancel, { once: true });
  let timedOut = false;
  const timer = setTimeout(() => { timedOut = true; controller.abort(); }, timeoutMs);
  try {
    const response = await fetchImpl(`/.netlify/functions/${path}`, {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body), signal: controller.signal,
    });
    // Netlify's rate-limit response may be HTML or plain text.
    if (response.status === 429) throw new Error('rate_limited');
    if (response.status === 404 || !(response.headers.get('content-type') || '').includes('application/json')) throw new Error('functions_unavailable');
    const data = await response.json();
    if (!response.ok) throw new Error(data.error || 'calendar_unavailable');
    return data;
  } catch (error) {
    if (timedOut) throw new Error('request_timeout');
    throw error;
  } finally {
    clearTimeout(timer);
    signal?.removeEventListener('abort', cancel);
  }
}
