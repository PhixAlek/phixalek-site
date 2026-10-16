/** Compact comment dates; the exact timestamp remains available on the time element. */
export function relativeCommentDate(value, locale = 'en', now = Date.now()) {
  const elapsed = Math.max(0, now - Date.parse(value));
  const units = [['year', 365 * 86400000], ['month', 30 * 86400000], ['week', 7 * 86400000],
    ['day', 86400000], ['hour', 3600000], ['minute', 60000]];
  const [unit, duration] = units.find(([, duration]) => elapsed >= duration) || ['second', 1000];
  return new Intl.RelativeTimeFormat(locale, { numeric: 'auto' }).format(-Math.floor(elapsed / duration), unit);
}
