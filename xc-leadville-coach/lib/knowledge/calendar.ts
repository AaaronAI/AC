// KILM domain: calendar facts
// Constraints the coach respects when planning. Add new events as they appear.

export type CalendarEventKind =
  | "trip"
  | "recurring"
  | "race"
  | "block-travel"
  | "block-altitude"
  | "block-deload";

export type CalendarEvent = {
  id: string;
  title: string;
  start: string; // ISO
  end: string; // ISO
  kind: CalendarEventKind;
  blocksTraining: boolean;
  notes?: string;
};

export const CALENDAR: CalendarEvent[] = [
  {
    id: "breck-dillon",
    title: "Breck / Dillon training trip",
    start: "2026-06-17",
    end: "2026-06-19",
    kind: "block-altitude",
    blocksTraining: false,
    notes: "Altitude block — schedule one massive at altitude.",
  },
  {
    id: "jersey-shore",
    title: "Jersey Shore trip",
    start: "2026-06-25",
    end: "2026-06-30",
    kind: "block-travel",
    blocksTraining: true,
    notes: "Deload week. Maintain with walks + short spins if available.",
  },
  {
    id: "leadville-stay",
    title: "Leadville race stay",
    start: "2026-07-09",
    end: "2026-07-13",
    kind: "race",
    blocksTraining: false,
    notes: "Arrive, openers, race, recover.",
  },
  {
    id: "volleyball",
    title: "Tuesday volleyball",
    start: "recurring:tue",
    end: "recurring:tue",
    kind: "recurring",
    blocksTraining: false,
    notes: "Counts as ~moderate neuromuscular load.",
  },
];

export function eventsInRange(start: Date, end: Date): CalendarEvent[] {
  return CALENDAR.filter((e) => {
    if (e.start.startsWith("recurring:")) return false;
    const s = new Date(e.start);
    const en = new Date(e.end);
    return en >= start && s <= end;
  });
}

export function isInTrip(date: Date): CalendarEvent | undefined {
  return CALENDAR.find((e) => {
    if (e.start.startsWith("recurring:")) return false;
    return date >= new Date(e.start) && date <= new Date(e.end);
  });
}
