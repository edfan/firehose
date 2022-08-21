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
      {str.split(/([0-9]*[A-Z]*\.[0-9A-Z]+)/).map((text, i) => {
        const cls = firehose.classes.get(text);
        if (!cls) return text;
        return (
          <Link key={i} onClick={() => firehose.setViewedActivity(cls)}>
            {text}
          </Link>
        );
      })}
    </>
  );
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
