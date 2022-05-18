import { Activity } from "./activity";

/**
 * Rounds {@param x} to {@param n} decimal places?
 * TODO: figure out what this does and then remove it
 */
export function formatNumber(x: number, n: number) {
  const re = "\\d(?=(\\d{" + (x || 3) + "})+" + (n > 0 ? "\\." : "$") + ")";
  return x.toFixed(Math.max(0, ~~n)).replace(new RegExp(re, "g"), "$&,");
}

/**
 * This regex matches a class number like 6.042J or 21W.THU. The groups are
 * courseDigits ("6", "21"), courseLetters ("", "W"), and classNumber ("042J",
 * "THU").
 */
const CLASS_REGEX = new RegExp(
  [
    "^",
    "(?<courseDigits>[0-9]*)",
    "(?<courseLetters>[A-Z]*)",
    "\\.",
    "(?<classNumber>[0-9A-Z]*)",
    "$",
  ].join("")
);

/** Three-way comparison for class numbers. */
export function classSort(a: string, b: string) {
  const aGroups = a.match(CLASS_REGEX)?.groups;
  const bGroups = b.match(CLASS_REGEX)?.groups;
  if (!aGroups || !bGroups) return 0;
  const aCourseNumber = Number(aGroups.courseDigits || "Infinity");
  const bCourseNumber = Number(bGroups.courseDigits || "Infinity");
  if (aCourseNumber > bCourseNumber) return 1;
  if (aCourseNumber < bCourseNumber) return -1;
  if (aGroups.courseLetters > bGroups.courseLetters) return 1;
  if (aGroups.courseLetters < bGroups.courseLetters) return -1;
  if (aGroups.classNumber > bGroups.classNumber) return 1;
  if (aGroups.classNumber < bGroups.classNumber) return -1;
  return 0;
}

/** Turn a string lowercase and keep only alphanumeric characters. */
export function simplifyString(s: string): string {
  return s.toLowerCase().replaceAll(/[^a-z0-9]/g, "");
}

/**
 * Smart class number matching. Case-insensitive. Punctuation-insensitive when
 * the searchString has no punctuation, but cares otherwise.
 */
export function classNumberMatch(
  searchString: string,
  classNumber: string
): boolean {
  if (searchString.includes(".")) {
    const lower = (s: string) => s.toLowerCase();
    return lower(classNumber).startsWith(lower(searchString));
  } else {
    return simplifyString(classNumber).startsWith(simplifyString(searchString));
  }
}

// Date utilities:
// TODO: rename these

/**
 * Converts a slot number (as in {@link Timeslot}) to a date in the week of
 * 2001-01-01, which is the week the calendar shows.
 */
export function toDate(slot: number): Date {
  const day = Math.floor(slot / 30) + 1;
  const hour = Math.floor((slot % 30) / 2) + 8;
  const minute = (slot % 2) * 30;
  return new Date(2001, 0, day, hour, minute);
}

/** Converts date (within 8 AM to 9 PM) to a slot number. */
export function toSlot(date: Date): number {
  return (
    30 * (date.getDay() - 1) +
    2 * (date.getHours() - 8) +
    Math.floor(date.getMinutes() / 30)
  );
}

/** Strings for each weekday. */
export const WEEKDAY_STRINGS = ["Mon", "Tue", "Wed", "Thu", "Fri"];

/** See {@link TIMESLOT_STRINGS}. */
function generateTimeslotStrings(): Array<string> {
  const res = [];
  for (let i = 8; i <= 11; i++) {
    res.push(`${i}:00 AM`);
    res.push(`${i}:30 AM`);
  }
  res.push("12:00 PM");
  res.push("12:30 PM");
  for (let i = 1; i <= 9; i++) {
    res.push(`${i}:00 PM`);
    res.push(`${i}:30 PM`);
  }
  return res;
}

/** Strings for each slot number, in order. */
export const TIMESLOT_STRINGS = generateTimeslotStrings();

/** Convert a slot number to a day string. */
export function slotToDayString(slot: number): string {
  return WEEKDAY_STRINGS[Math.floor(slot / 30)]!;
}

/** Convert a slot number to a time string. */
export function slotToTimeString(slot: number): string {
  return TIMESLOT_STRINGS[slot % 30]!;
}

/** Converts a day and time stirng to a slot number. */
export function dayStringToSlot(day: string, time: string): number {
  return 30 * WEEKDAY_STRINGS.indexOf(day) + TIMESLOT_STRINGS.indexOf(time);
}

// Color utilities:

export const FALLBACK_COLOR = "#4A4A4A";

const BACKGROUND_COLORS = [
  "#D32F2F",
  "#2E7D32",
  "#1565C0",
  "#BF360C",
  "#00838f",
  "#AD1457",
  "#827717",
  "#795548",
];

/** MurmurHash3, seeded with a string. */
function murmur3(str: string): () => number {
  let hash = 1779033703 ^ str.length;
  for (let i = 0; i < str.length; i++) {
    hash = Math.imul(hash ^ str.charCodeAt(i), 3432918353);
    hash = (hash << 13) | (hash >>> 19);
  }
  return () => {
    hash = Math.imul(hash ^ (hash >>> 16), 2246822507);
    hash = Math.imul(hash ^ (hash >>> 13), 3266489909);
    return (hash ^= hash >>> 16) >>> 0;
  };
}

/**
 * Assign background colors to a list of activities. Mutates each activity
 * in the list.
 */
export function chooseColors(activities: Array<Activity>): void {
  // above this length, we give up trying to be nice:
  const colorLen = BACKGROUND_COLORS.length;
  const indices: Array<number> = [];
  for (const activity of activities) {
    const hash = murmur3(activity.id);
    let index = hash() % colorLen;
    // try to pick distinct colors if possible; hash to try to make each
    // activity have a consistent color.
    while (indices.length < colorLen && indices.indexOf(index) !== -1) {
      index = hash() % colorLen;
    }
    indices.push(index);
    activity.backgroundColor = BACKGROUND_COLORS[index];
  }
}
