import { Section, Timeslot, Sections, Class } from "./class";

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

export function selectSlots(
  currentClasses: Array<Class>,
  lockedSlots: Map<string, string | number>
): {
  // [class number, section kind]
  allSections: Array<[string, string]>;
  // each entry is e.g. [0, 0, 1], for options 0, 0, 1 of allSections
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
      if (option !== undefined && option !== "none") {
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
    allSections: [lockedSections, freeSections].flat().map((sec) => [sec.cls.number, sec.kind]),
    options: options.map((opt) => lockedOptions.concat(opt).map((sec) => sec.index)),
  };
}
