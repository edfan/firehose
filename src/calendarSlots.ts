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
 * Find best options for choosing sections among classes. Returns list of list
 * of possible options.
 *
 * @param selectedClasses - Current classes to schedule
 * @returns List of schedule options; each schedule option is a list of all
 *    sections in that schedule, including locked sections (but not including
 *    non-class activities.)
 */
export function scheduleSlots(
  selectedClasses: Array<Class>
): Array<Array<Section>> {
  const lockedSections: Array<Sections> = [];
  const lockedOptions: Array<Section> = [];
  const initialSlots: Array<Timeslot> = [];
  const freeSections: Array<Sections> = [];

  for (const cls of selectedClasses) {
    for (const secs of cls.sections) {
      if (cls.lockedSections.get(secs.kind)) {
        const sec = cls.selectedSections.get(secs.kind);
        if (sec) {
          lockedSections.push(secs);
          lockedOptions.push(sec);
          initialSlots.push(...sec.timeslots);
        } else {
          // locked to having no section, do nothing
        }
      } else {
        freeSections.push(secs);
      }
    }
  }

  return selectHelper(freeSections, initialSlots, [], 0, Infinity).options;
}
