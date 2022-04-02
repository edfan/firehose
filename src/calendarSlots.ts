import { Section, Timeslot, Sections, Class } from "./class";

/**
 * Helper function for selectSlots. Implements backtracking: we try to place
 * freeSections while counting the number of conflicts, returning all options
 * with the minimum number of conflicts.
 *
 * @param freeSections - Remaining sections to schedule
 * @param filledSlots - Timeslots that have been scheduled
 * @param foundOptions - Option currently being built
 * @param curConflicts - Current number of conflicts of foundOptions
 * @param foundMinConflicts - Best number of conflicts so far
 * @returns Object with best options found so far and number of conflicts
 */
function selectHelper(
  freeSections: Array<Sections>,
  filledSlots: Array<Timeslot>,
  foundOptions: Array<Section>,
  curConflicts: number,
  foundMinConflicts: number
): {
  options: Array<Array<Section>>;
  minConflicts: number;
} {
  if (freeSections.length === 0) {
    return { options: [foundOptions], minConflicts: curConflicts };
  }

  let options: Array<Array<Section>> = [];
  let minConflicts: number = foundMinConflicts;

  const [secs, ...remainingSections] = freeSections;

  for (const sec of secs.sections) {
    const newConflicts = sec.countConflicts(filledSlots);
    if (curConflicts + newConflicts > foundMinConflicts) continue;

    const { options: newOptions, minConflicts: newMinConflicts } = selectHelper(
      remainingSections,
      filledSlots.concat(sec.timeslots),
      foundOptions.concat(sec),
      curConflicts + newConflicts,
      foundMinConflicts
    );

    if (newMinConflicts < minConflicts) {
      options = [];
      minConflicts = newMinConflicts;
    }

    if (newMinConflicts === minConflicts) {
      options.push(...newOptions);
    }
  }

  return { options, minConflicts };
}

/**
 * Find best options for choosing sections among classes. Returns list of
 * sections, and list of options for which sections to pick.
 *
 * TODO: there should be a *much* better interface for this
 *
 * @param currentClasses - Current classes to schedule
 * @param lockedSlots - Locked class slots
 * @returns Object with
 *    allSections - e.g. [["6.036", LECTURE], ["6.036", LAB], ...]
 *    options - e.g. [[2, 0, ...]] for 2nd 6.036 LECTURE, 0th 6.036 LAB, etc.
 */
export function selectSlots(
  currentClasses: Array<Class>,
  lockedSlots: Map<string, string | number>
): {
  allSections: Array<[string, string]>;
  options: Array<Array<number>>;
} {
  const lockedSections: Array<Sections> = [];
  const lockedOptions: Array<Section> = [];
  const initialSlots: Array<Timeslot> = [];
  const freeSections: Array<Sections> = [];

  for (const cls of currentClasses) {
    for (const secs of cls.sections) {
      const key = `${cls.number},${secs.kind}`;
      const option = lockedSlots.get(key);
      if (option === "none") {
        // do nothing
      } else if (option !== undefined) {
        const sec = secs.sections[option as number];
        lockedSections.push(secs);
        lockedOptions.push(sec);
        initialSlots.push(...sec.timeslots);
      } else {
        freeSections.push(secs);
      }
    }
  }

  const { options } = selectHelper(freeSections, initialSlots, [], 0, Infinity);

  return {
    allSections: [lockedSections, freeSections]
      .flat()
      .map((sec) => [sec.cls.number, sec.kind]),
    options: options.map((opt) =>
      lockedOptions.concat(opt).map((sec) => sec.index)
    ),
  };
}
