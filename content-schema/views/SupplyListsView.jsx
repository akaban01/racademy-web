/**
 * Renders content/supply-lists.json into the exact markup the old
 * client-side renderSupplyLists() used to build inside #grades-root.
 * Shared by the build-time generator (scripts/build-content.mjs) and the
 * Puck editor's live preview - this is the single source of truth for
 * "what does this data render as".
 *
 * Checkbox wrapping, per-grade progress badges and print/clear buttons are
 * added client-side by initSupplyChecklist() (see nav.js-adjacent inline
 * script on the page) once this markup is in the DOM - they are not part of
 * this render.
 */
export function SupplyListsView({ grades }) {
  return (
    <>
      {(grades || []).map((grade, gradeIdx) => (
        <details className="grade" key={gradeIdx}>
          <summary>
            <div className="grade-title">
              <span className="grade-tag">{grade.tag || ''}</span>
              <span className="grade-name">{grade.name || ''}</span>
            </div>
            <span className="grade-chev" aria-hidden="true">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round">
                <path d="M6 9l6 6 6-6" />
              </svg>
            </span>
          </summary>
          <div className="grade-body">
            {(grade.subjects || []).map((subject, subjectIdx) => (
              <div className="subject" key={subjectIdx}>
                <h4>{subject.title || ''}</h4>
                {subject.note ? <p className="subject-note">{subject.note}</p> : null}
                <ul className="supply-list">
                  {(subject.items || []).map((item, itemIdx) => (
                    <li key={itemIdx}>{item}</li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </details>
      ))}
    </>
  );
}
