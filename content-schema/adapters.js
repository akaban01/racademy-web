/**
 * Puck's <Puck data={...}> expects its own envelope:
 *   { content: [], root: { props: {...} }, zones: {} }
 * Our two datasets are plain structured JSON (see content/*.json) with no
 * draggable layout, so we only ever use root-level fields - these just
 * wrap/unwrap the flat JSON into that envelope in memory. The files on disk
 * never change shape.
 */

export function toPuckData(json) {
  return {
    content: [],
    root: { props: json || {} },
    zones: {},
  };
}

export function fromPuckData(puckData) {
  return (puckData && puckData.root && puckData.root.props) || {};
}

/*
 * Puck's "array" field requires each item to be an object (see
 * @measured/puck's ArrayField type: arrayFields is keyed by the item's own
 * prop names). content/supply-lists.json stores each subject's `items` as
 * a plain string list, so it's wrapped as [{ value: "..." }] only while
 * editing, and unwrapped again before writing back to disk.
 */
export function supplyListsJsonToProps(json) {
  return {
    grades: (json.grades || []).map((grade) => ({
      ...grade,
      subjects: (grade.subjects || []).map((subject) => ({
        ...subject,
        items: (subject.items || []).map((value) => ({ value })),
      })),
    })),
  };
}

export function supplyListsPropsToJson(props) {
  return {
    grades: (props.grades || []).map((grade) => ({
      ...grade,
      subjects: (grade.subjects || []).map((subject) => ({
        ...subject,
        items: (subject.items || []).map((item) => item.value || ''),
      })),
    })),
  };
}
