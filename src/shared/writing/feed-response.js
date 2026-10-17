export const MAX_FEED_BYTES = 2 * 1024 * 1024;

export async function readFeedText(response) {
  if (!response.ok || !response.body) throw new Error('Feed unavailable');
  if (Number(response.headers.get('content-length')) > MAX_FEED_BYTES) throw new Error('Feed too large');
  const reader = response.body.getReader();
  const decoder = new TextDecoder('utf-8', { fatal: true });
  const chunks = [];
  let bytes = 0;
  try {
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      bytes += value.byteLength;
      if (bytes > MAX_FEED_BYTES) throw new Error('Feed too large');
      chunks.push(decoder.decode(value, { stream: true }));
    }
    chunks.push(decoder.decode());
    return chunks.join('');
  } finally { await reader.cancel(); }
}
