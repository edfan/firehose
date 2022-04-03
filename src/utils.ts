import { Class, NonClass } from "./class";

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

/**
 * Smart class number matching. Case-insensitive. Punctuation-insensitive when
 * the searchString has no punctuation, but cares otherwise.
 */
export function classNumberMatch(searchString: string, classNumber: string) {
  const lower = (s: string) => s.toLowerCase();
  const simplify = (s: string) => lower(s).replaceAll(/[^a-z0-9]/g, "");
  if (searchString.includes(".")) {
    return lower(classNumber).includes(lower(searchString));
  } else {
    return simplify(classNumber).includes(simplify(searchString));
  }
}

/**
 * Converts a timeslot (as in {@link Timeslot}) to a date in the week of
 * 2001-01-01, which is the week the calendar shows.
 */
export function toDate(slot: number): Date {
  const day = Math.floor(slot / 30) + 1;
  const hour = Math.floor((slot % 30) / 2) + 8;
  const minute = (slot % 2) * 30;
  return new Date(2001, 0, day, hour, minute);
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
export function chooseColors(activities: Array<Class | NonClass>): void {
  // above this length, we give up trying to be nice:
  const colorLen = BACKGROUND_COLORS.length;
  const indices: Array<number> = [];
  for (const activity of activities) {
    const hash = murmur3(activity.name);
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
