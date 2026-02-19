import stringWidth from 'string-width';

/**
 * Truncate a string to fit within `maxWidth` terminal columns.
 * Handles full-width characters (CJK, emoji, etc.) correctly.
 */
export function truncateText(input: string, maxWidth: number): string {
  if (maxWidth <= 0) return '';
  if (stringWidth(input) <= maxWidth) return input;

  const suffix = maxWidth > 3 ? '...' : '';
  const limit = maxWidth - suffix.length;

  let width = 0;
  let i = 0;
  const chars = [...input]; // iterate by grapheme-safe codepoints
  for (; i < chars.length; i++) {
    const w = stringWidth(chars[i]);
    if (width + w > limit) break;
    width += w;
  }
  return chars.slice(0, i).join('') + suffix;
}

/**
 * Pad a string with spaces to exactly `targetWidth` terminal columns,
 * then truncate if it exceeds that width. Equivalent to padEnd+slice
 * but respects display width.
 */
export function padEndColumns(input: string, targetWidth: number): string {
  const w = stringWidth(input);
  if (w >= targetWidth) {
    return truncateText(input, targetWidth);
  }
  return input + ' '.repeat(targetWidth - w);
}

export function inlineBar(pct: number, width: number): string {
  const filled = Math.max(0, Math.min(width, Math.round((pct / 100) * width)));
  return '[' + '█'.repeat(filled) + '░'.repeat(width - filled) + ']';
}

export function clampPercent(value?: number, max?: number): number {
  if (typeof value !== 'number' || typeof max !== 'number' || max <= 0) return 0;
  return Math.max(0, Math.min(100, Math.round((value / max) * 100)));
}

export function metricColor(pct: number): string {
  if (pct >= 66) return 'green';
  if (pct >= 33) return 'yellow';
  return 'red';
}

export function metricStr(value?: number, max?: number): string {
  if (typeof value !== 'number' || typeof max !== 'number') return '?';
  const w = String(max).length;
  return `${String(value).padStart(w)}/${max}`;
}
