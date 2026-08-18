/**
 * Pure date-math helpers for the academic calendar, ported from the
 * client-side render script that used to live in
 * parent-resources/academic-calendar/index.html. No DOM access here — these
 * run identically at build time (Node) and inside the editor (browser).
 */

export const MONTH_INDEX = {
  jan: 0, feb: 1, mar: 2, apr: 3, may: 4, jun: 5,
  jul: 6, aug: 7, sep: 8, oct: 9, nov: 10, dec: 11,
};

export const MONTH_NAMES = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
];

export const DOW = ['S', 'M', 'T', 'W', 'T', 'F', 'S'];

/* Which tag wins the colour of a day that carries several events - parents
   scan first for "is there school", so "No School" sits at the top. 'break'
   and 'holiday' are legacy aliases of 'off' and rank alongside it. */
export const TAG_PRIORITY = ['off', 'break', 'holiday', 'staff', 'key', 'conf', 'test', 'comp', 'islamic', 'event'];

export function dayKey(y, m, d) {
  return y + '-' + m + '-' + d;
}

/** "August 2026" -> { month: 7, year: 2026 } */
export function parseMonthHeading(name) {
  const match = String(name || '').match(/([A-Za-z]+)\s*(\d{4})/);
  if (!match) return null;
  const month = MONTH_INDEX[match[1].slice(0, 3).toLowerCase()];
  if (month === undefined) return null;
  return { month, year: parseInt(match[2], 10) };
}

/** One side of a date string: "Aug 3", "August 3" or a bare "7". */
export function parseDatePart(part, fallbackMonth) {
  const match = String(part).trim().match(/^([A-Za-z]+)?\.?\s*(\d{1,2})$/);
  if (!match) return null;
  const month = match[1] ? MONTH_INDEX[match[1].slice(0, 3).toLowerCase()] : fallbackMonth;
  if (month === undefined) return null;
  return { month, day: parseInt(match[2], 10) };
}

/* An event sitting in the "December 2026" block that reads "Jan 1" belongs to
   2027 - pick whichever year keeps it closest to its own month block. */
export function yearFor(month, blockMonth, blockYear) {
  if (month - blockMonth > 6) return blockYear - 1;
  if (blockMonth - month > 6) return blockYear + 1;
  return blockYear;
}

/** "Aug 3–7", "Dec 21 – Jan 1", "Aug 10" -> [Date, ...] (inclusive). */
export function datesForEvent(dateStr, blockMonth, blockYear) {
  const parts = String(dateStr || '').split(/\s*[–—-]\s*/);
  const start = parseDatePart(parts[0], blockMonth);
  if (!start) return [];

  const startYear = yearFor(start.month, blockMonth, blockYear);
  const from = new Date(startYear, start.month, start.day);
  if (isNaN(from) || from.getDate() !== start.day) return [];

  let to = from;
  if (parts.length > 1) {
    const end = parseDatePart(parts[1], start.month);
    if (end) {
      const endYear = end.month < start.month ? startYear + 1 : startYear;
      const candidate = new Date(endYear, end.month, end.day);
      if (!isNaN(candidate) && candidate.getDate() === end.day && candidate >= from) to = candidate;
    }
  }

  const out = [];
  const cursor = new Date(from);
  while (cursor <= to && out.length < 400) {
    out.push(new Date(cursor));
    cursor.setDate(cursor.getDate() + 1);
  }
  return out;
}

/** day key -> [{ tag, name, date, rowId }] across every month block. */
export function buildDayIndex(months) {
  const index = {};
  months.forEach((month, monthIdx) => {
    const heading = parseMonthHeading(month.name);
    if (!heading) return;
    (month.events || []).forEach((ev, evIdx) => {
      datesForEvent(ev.date, heading.month, heading.year).forEach((d) => {
        const key = dayKey(d.getFullYear(), d.getMonth(), d.getDate());
        (index[key] || (index[key] = [])).push({
          tag: ev.tag || 'key',
          name: ev.name || '',
          date: ev.date || '',
          rowId: 'cal-ev-' + monthIdx + '-' + evIdx,
        });
      });
    });
  });
  return index;
}

export function topTag(entries) {
  let best = null;
  let bestRank = Infinity;
  entries.forEach((entry) => {
    let rank = TAG_PRIORITY.indexOf(entry.tag);
    if (rank === -1) rank = TAG_PRIORITY.length;
    if (rank < bestRank) { bestRank = rank; best = entry.tag; }
  });
  return best || 'key';
}
