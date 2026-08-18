import {
  MONTH_NAMES,
  DOW,
  dayKey,
  parseMonthHeading,
  buildDayIndex,
  topTag,
} from './calendar-utils.js';

/**
 * Renders content/academic-calendar.json into the exact markup the old
 * client-side renderCalendar()/renderYearView() used to build. Shared by
 * the build-time generator (scripts/build-content.mjs) and the Puck
 * editor's live preview.
 *
 * "Today" highlighting on the mini-month grid is intentionally NOT baked in
 * here (it would freeze at whatever day the site was last built) - the day
 * cells below carry data-y/data-m/data-d attributes instead, and a small
 * client-side script on the page adds the .is-today class after load.
 */

export function CalendarHighlights({ highlights }) {
  return (
    <>
      {(highlights || []).map((h, i) => (
        <div className="cal-highlight" key={i}>
          <div className="cal-highlight-date">{h.date || ''}</div>
          <div className="cal-highlight-label">{h.label || ''}</div>
        </div>
      ))}
    </>
  );
}

export function CalendarMonths({ months }) {
  return (
    <>
      {(months || []).map((month, monthIdx) => (
        <div className="cal-month" key={monthIdx}>
          <h3>{month.name || ''}</h3>
          <ul className="cal-events">
            {(month.events || []).map((ev, evIdx) => (
              <li className="cal-event-row" id={`cal-ev-${monthIdx}-${evIdx}`} key={evIdx}>
                <span className="cal-date">{ev.date || ''}</span>
                <span className="cal-event-name">{ev.name || ''}</span>
                <span className={`cal-tag tag-${ev.tag || 'key'}`}>{ev.tagLabel || ''}</span>
              </li>
            ))}
          </ul>
        </div>
      ))}
    </>
  );
}

function MiniMonth({ month, dayIndex }) {
  const heading = parseMonthHeading(month.name);
  if (!heading) return null;

  const firstWeekday = new Date(heading.year, heading.month, 1).getDay();
  const daysInMonth = new Date(heading.year, heading.month + 1, 0).getDate();
  const days = [];
  for (let day = 1; day <= daysInMonth; day++) {
    const date = new Date(heading.year, heading.month, day);
    const weekday = date.getDay();
    const entries = dayIndex[dayKey(heading.year, heading.month, day)] || [];
    const isWeekend = weekday === 0 || weekday === 6;

    if (entries.length) {
      const tags = entries.map((e) => e.tag);
      const distinct = tags.filter((t, i) => tags.indexOf(t) === i);
      const names = entries.map((e) => e.name).join(' · ');
      const label = `${MONTH_NAMES[heading.month]} ${day}: ${names}`;
      const className = ['cal-cell', distinct.length > 1 ? 'has-multi' : null, isWeekend ? 'is-weekend' : null]
        .filter(Boolean)
        .join(' ');
      days.push(
        <button
          type="button"
          key={day}
          className={className}
          data-tag={topTag(entries)}
          data-row-id={entries[0].rowId}
          data-y={heading.year}
          data-m={heading.month}
          data-d={day}
          title={label}
          aria-label={label}
        >
          {day}
        </button>
      );
    } else {
      const className = ['cal-cell', isWeekend ? 'is-weekend' : null].filter(Boolean).join(' ');
      days.push(
        <div key={day} className={className} data-y={heading.year} data-m={heading.month} data-d={day}>
          {day}
        </div>
      );
    }
  }

  return (
    <div>
      <div className="cal-mini-name">
        {MONTH_NAMES[heading.month].slice(0, 3)} <span className="yr">{heading.year}</span>
      </div>
      <div className="cal-mini-grid" role="group" aria-label={`${MONTH_NAMES[heading.month]} ${heading.year}`}>
        {DOW.map((letter, i) => (
          <div className="cal-dow" aria-hidden="true" key={i} style={i === 0 || i === 6 ? { opacity: '0.55' } : undefined}>
            {letter}
          </div>
        ))}
        {Array.from({ length: firstWeekday }).map((_, i) => (
          <div className="cal-cell is-blank" aria-hidden="true" key={`blank-${i}`} />
        ))}
        {days}
      </div>
    </div>
  );
}

export function CalendarYearGrid({ months }) {
  const dayIndex = buildDayIndex(months || []);
  return (
    <>
      {(months || []).map((month, i) => (
        <MiniMonth month={month} dayIndex={dayIndex} key={i} />
      ))}
    </>
  );
}
