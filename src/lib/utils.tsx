import { Link } from "@chakra-ui/react";
// @ts-ignore
import Msgpack from "msgpack-lite";

import { Firehose } from "./firehose";

//========================================================================
// Class utilities:

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
  classNumber: string,
  exact: boolean = false
): boolean {
  const process = (s: string) =>
    searchString.includes(".") ? s.toLowerCase() : simplifyString(s);
  const compare = (a: string, b: string) => (exact ? a === b : a.includes(b));
  return compare(process(classNumber), process(searchString));
}

/** Wrapper to link all classes in a given string. */
export function linkClasses(firehose: Firehose, str: string): JSX.Element {
  return (
    <>
      {str.split(/([0-9]*[A-Z]*\.[0-9A-Z]+)/).map((text) => {
        const cls = firehose.classes.get(text);
        if (!cls) return text;
        return (
          <Link key={text} onClick={() => firehose.setViewedActivity(cls)}>
            {text}
          </Link>
        );
      })}
    </>
  );
}

//========================================================================
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
  res.push(`10:00 PM`);
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

//========================================================================
// Other utilities:

/** Takes the sum of an array. */
export function sum(arr: Array<number>): number {
  return arr.reduce((acc, cur) => acc + cur, 0);
}

export function urlencode(obj: any): string {
  return btoa(String.fromCharCode.apply(null, Msgpack.encode(obj)));
}

export function urldecode(obj: string): any {
  return Msgpack.decode(
    new Uint8Array(
      atob(obj)
        .split("")
        .map((c) => c.charCodeAt(0))
    )
  );
}
