/** Parse public provider JSON; never evaluate its scripts. */
export function readPublicData(html) {
  if (typeof html !== 'string' || html.length > 2_000_000) return null;
  for (const script of html.matchAll(/<script\b([^>]*)>([\s\S]*?)<\/script\s*>/gi)) {
    if (/\bid\s*=\s*["']preloads-json["']/i.test(script[1])
      && /\btype\s*=\s*["']application\/json["']/i.test(script[1])) {
      try { return JSON.parse(script[2]); } catch { return null; }
    }
  }
  const match = html.match(/window\._preloads\s*=\s*JSON\.parse\(\s*("(?:\\.|[^"\\])*")\s*\)/);
  try { return match ? JSON.parse(JSON.parse(match[1])) : null; } catch { return null; }
}
