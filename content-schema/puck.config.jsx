import { SupplyListsView } from './views/SupplyListsView.jsx';
import { CalendarHighlights, CalendarYearGrid, CalendarMonths } from './views/AcademicCalendarView.jsx';

/**
 * Puck (@puckeditor/core, formerly @measured/puck) configs for the editor
 * app only - the build-time generator (scripts/build-content.mjs) renders
 * the view components directly from plain JSON and never imports this
 * file or Puck itself.
 *
 * Both datasets are pure structured data (no free-form page layout), so
 * these use root-only fields (array/object/select) rather than a
 * draggable `components` map - see content-schema/adapters.js for why
 * `items` (a plain string list on disk) is wrapped as [{ value }] here.
 */

export const supplyListsConfig = {
  components: {},
  root: {
    fields: {
      grades: {
        type: 'array',
        label: 'Grades',
        getItemSummary: (item) => item.name || 'Grade',
        arrayFields: {
          tag: {
            type: 'text',
            label: 'Grade Tag',
          },
          name: {
            type: 'text',
            label: 'Grade Name',
          },
          subjects: {
            type: 'array',
            label: 'Subjects',
            getItemSummary: (item) => item.title || 'Subject',
            arrayFields: {
              title: {
                type: 'text',
                label: 'Subject Title',
              },
              note: {
                type: 'textarea',
                label: 'Note (optional)',
              },
              items: {
                type: 'array',
                label: 'Supply Items',
                getItemSummary: (item) => item.value || 'Item',
                arrayFields: {
                  value: { type: 'text', label: 'Item' },
                },
              },
            },
          },
        },
      },
    },
    render: ({ grades }) => <SupplyListsView grades={grades} />,
  },
};

const CALENDAR_TAG_OPTIONS = [
  { label: 'No School (break / holiday / student holiday)', value: 'off' },
  { label: 'Key Date', value: 'key' },
  { label: 'Staff Day (students not in session)', value: 'staff' },
  { label: 'Conference', value: 'conf' },
  { label: 'Testing', value: 'test' },
  { label: 'Competition', value: 'comp' },
  { label: 'School Event', value: 'event' },
  { label: 'Observance (school in session)', value: 'islamic' },
];

export const academicCalendarConfig = {
  components: {},
  root: {
    fields: {
      highlights: {
        type: 'array',
        label: 'Key Highlights',
        getItemSummary: (item) => (item.date ? `${item.date} — ${item.label || ''}` : 'Highlight'),
        arrayFields: {
          date: { type: 'text', label: 'Date' },
          label: { type: 'text', label: 'Label' },
        },
      },
      months: {
        type: 'array',
        label: 'Months',
        getItemSummary: (item) => item.name || 'Month',
        arrayFields: {
          name: {
            type: 'text',
            label: 'Month Name',
          },
          events: {
            type: 'array',
            label: 'Events',
            getItemSummary: (item) => (item.date ? `${item.date} — ${item.name || ''}` : 'Event'),
            arrayFields: {
              date: { type: 'text', label: 'Date' },
              name: { type: 'text', label: 'Event Name' },
              tag: {
                type: 'select',
                label: 'Tag Color',
                options: CALENDAR_TAG_OPTIONS,
              },
              tagLabel: { type: 'text', label: 'Tag Text' },
            },
          },
        },
      },
    },
    render: ({ highlights, months }) => (
      <>
        <CalendarHighlights highlights={highlights} />
        <CalendarYearGrid months={months} />
        <CalendarMonths months={months} />
      </>
    ),
  },
};
