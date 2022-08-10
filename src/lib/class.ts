import { Timeslot, Event } from "./activity";
import { TColorScheme, fallbackColor } from "./colors";
import { RawClass, RawSection } from "./rawClass";

// This isn't exported intentionally. Instead of using this, can you use
// Sections directly?
enum SectionKind {
  LECTURE,
  RECITATION,
  LAB,
}

/** Flags. */
export type Flags = {
  nonext: boolean;
  under: boolean;
  grad: boolean;
  fall: boolean;
  iap: boolean;
  spring: boolean;
  summer: boolean;
  repeat: boolean;
  rest: boolean;
  Lab: boolean;
  PartLab: boolean;
  hass: boolean;
  hassH: boolean;
  hassA: boolean;
  hassS: boolean;
  hassE: boolean;
  cih: boolean;
  cihw: boolean;
  notcih: boolean;
  final: boolean;
  nofinal: boolean;
  le9units: boolean;
  half: number | boolean;
  limited: boolean;
};

/**
 * A section is an array of timeslots that meet in the same room for the same
 * purpose. Sections can be lectures, recitations, or labs, for a given class.
 * All instances of Section belong to a Sections.
 */
export class Section {
  /** Group of sections this section belongs to */
  secs: Sections;
  /** Timeslots this section meets */
  timeslots: Array<Timeslot>;
  /** String representing raw timeslots, e.g. MW9-11 or T2,F1. */
  rawTime: string;
  /** Room this section meets in */
  room: string;

  /** @param section - raw section info (timeslot and room) */
  constructor(secs: Sections, rawTime: string, section: RawSection) {
    this.secs = secs;
    this.rawTime = rawTime;
    const [rawSlots, room] = section;
    this.timeslots = rawSlots.map((slot) => new Timeslot(...slot));
    this.room = room;
  }

  /**
   * @param currentSlots - array of timeslots currently occupied
   * @returns number of conflicts this section has with currentSlots
   */
  countConflicts(currentSlots: Array<Timeslot>): number {
    let conflicts = 0;
    for (const slot of this.timeslots) {
      for (const otherSlot of currentSlots) {
        conflicts += slot.conflicts(otherSlot) ? 1 : 0;
      }
    }
    return conflicts;
  }
}

/** The non-section options for a manual section time. */
export const LockOption = {
  Auto: "Auto",
  None: "None",
} as const;

/** The type of {@link LockOption}. */
type TLockOption = typeof LockOption[keyof typeof LockOption];

/** All section options for a manual section time. */
export type SectionLockOption = Section | TLockOption;

/**
 * A group of {@link Section}s, all the same kind (like lec, rec, or lab). At
 * most one of these can be selected at a time, and that selection is possibly
 * locked.
 */
export class Sections {
  cls: Class;
  kind: SectionKind;
  sections: Array<Section>;
  /** Are these sections locked? None counts as locked. */
  locked: boolean;
  /** Currently selected section out of these. None is null. */
  selected: Section | null;

  constructor(
    cls: Class,
    kind: SectionKind,
    rawTimes: Array<string>,
    secs: Array<RawSection>,
    locked?: boolean,
    selected?: Section | null
  ) {
    this.cls = cls;
    this.kind = kind;
    this.sections = secs.map((sec, i) => new Section(this, rawTimes[i]!, sec));
    this.locked = locked ?? false;
    this.selected = selected ?? null;
  }

  /** Short name for the kind of sections these are. */
  get shortName(): string {
    switch (this.kind) {
      case SectionKind.LECTURE:
        return "lec";
      case SectionKind.RECITATION:
        return "rec";
      default:
        return "lab";
    }
  }

  /** Name for the kind of sections these are. */
  get name(): string {
    switch (this.kind) {
      case SectionKind.LECTURE:
        return "Lecture";
      case SectionKind.RECITATION:
        return "Recitation";
      default:
        return "Lab";
    }
  }

  /** The event (possibly none) for this group of sections. */
  get event(): Event | null {
    return this.selected
      ? new Event(
          this.cls,
          `${this.cls.number} ${this.shortName}`,
          this.selected.timeslots,
          this.selected.room
        )
      : null;
  }

  /** Lock a specific section of this class. Does not validate. */
  lockSection(sec: SectionLockOption): void {
    if (sec === LockOption.Auto) {
      this.locked = false;
    } else if (sec === LockOption.None) {
      this.locked = true;
      this.selected = null;
    } else {
      this.locked = true;
      this.selected = sec;
    }
  }
}

/**
 * An entire class, e.g. 6.036, and its selected sections.
 *
 * TODO: should we allow users to add their own custom sections? and if so,
 * should they go here or Sections?
 */
export class Class {
  /** The RawClass being wrapped around. */
  readonly rawClass: RawClass;
  /** The sections associated with this class. */
  readonly sections: Array<Sections>;
  /** The background color for the class, used for buttons and calendar. */
  backgroundColor: string;
  /** Is the color set by the user (as opposed to chosen automatically?) */
  manualColor: boolean = false;

  constructor(rawClass: RawClass, colorScheme: TColorScheme) {
    this.rawClass = rawClass;
    this.sections = rawClass.s
      .map((kind) =>
        kind === "l"
          ? new Sections(this, SectionKind.LECTURE, rawClass.lr, rawClass.l)
          : kind === "r"
          ? new Sections(this, SectionKind.RECITATION, rawClass.rr, rawClass.r)
          : new Sections(this, SectionKind.LAB, rawClass.br, rawClass.b)
      )
      .sort((a, b) => a.kind - b.kind);
    this.backgroundColor = fallbackColor(colorScheme);
  }

  /** ID unique over all Activities. */
  get id(): string {
    return this.number;
  }

  /** Name, e.g. "Introduction to Machine Learning". */
  get name(): string {
    return this.rawClass.n;
  }

  /** Name that appears when it's on a button. */
  get buttonName(): string {
    return `${this.number}${this.warnings.suffix}`;
  }

  /** Number, e.g. "6.036". */
  get number(): string {
    return this.rawClass.no;
  }

  /** Course, e.g. "6". */
  get course(): string {
    return this.rawClass.co;
  }

  /** Units [in class, lab, out of class]. */
  get units(): Array<number> {
    return [this.rawClass.u1, this.rawClass.u2, this.rawClass.u3];
  }

  /** Total class units, usually 12. */
  get totalUnits(): number {
    return this.rawClass.u1 + this.rawClass.u2 + this.rawClass.u3;
  }

  /** Hours per week, taking from evals if exists, or units if not. */
  get hours(): number {
    return this.rawClass.h || this.totalUnits;
  }

  /** Get all calendar events corresponding to this class. */
  get events(): Array<Event> {
    return this.sections
      .map((secs) => secs.event)
      .filter((event): event is Event => event instanceof Event);
  }

  /** Object of boolean properties of class, used for filtering. */
  get flags(): Flags {
    return {
      nonext: this.rawClass.nx,
      under: this.rawClass.le === "U",
      grad: this.rawClass.le === "G",
      fall: this.rawClass.t.includes("FA"),
      iap: this.rawClass.t.includes("JA"),
      spring: this.rawClass.t.includes("SP"),
      summer: this.rawClass.t.includes("SU"),
      repeat: this.rawClass.rp,
      rest: this.rawClass.re,
      Lab: this.rawClass.la,
      PartLab: this.rawClass.pl,
      hass:
        this.rawClass.hh ||
        this.rawClass.ha ||
        this.rawClass.hs ||
        this.rawClass.he,
      hassH: this.rawClass.hh,
      hassA: this.rawClass.ha,
      hassS: this.rawClass.hs,
      hassE: this.rawClass.he,
      cih: this.rawClass.ci,
      cihw: this.rawClass.cw,
      notcih: !this.rawClass.ci && !this.rawClass.cw,
      final: this.rawClass.f,
      nofinal: !this.rawClass.f,
      le9units: this.totalUnits <= 9,
      half: this.rawClass.hf,
      limited: this.rawClass.lm,
    };
  }

  /** Evals, or N/A if non-existent. */
  get evals(): {
    rating: string;
    hours: string;
    people: string;
  } {
    if (this.rawClass.ra === 0) {
      return {
        rating: "N/A",
        hours: "N/A",
        people: "N/A",
      };
    } else {
      return {
        rating: `${this.rawClass.ra.toFixed(1)}/7.0`,
        hours: `${this.rawClass.h.toFixed(1)}`,
        people: `${this.rawClass.si.toFixed(1)}`,
      };
    }
  }

  /**
   * Related classes, in unspecified format, but likely to contain class
   * numbers as substrings.
   */
  get related(): {
    prereq: string;
    same: string;
    meets: string;
  } {
    return {
      prereq: this.rawClass.pr,
      same: this.rawClass.sa,
      meets: this.rawClass.mw,
    };
  }

  get warnings(): {
    suffix: string;
    messages: Array<string>;
  } {
    const suffixes: Array<string> = [];
    const messages: Array<string> = [];
    if (this.rawClass.h === 0) {
      suffixes.push("*");
      messages.push(
        "* Class does not have evaluations, so its hours were set to units."
      );
    }
    if (this.rawClass.tb) {
      suffixes.push("+");
      messages.push(
        "+ Class has at least one section yet to be scheduled—check course catalog."
      );
    }
    return { suffix: suffixes.join(""), messages };
  }

  /**
   * Class description and (person) in-charge. Extra URLs are labels and URLs
   * that should appear after the class description, like "Course Catalog" or
   * "Class Evaluations".
   */
  get description(): {
    description: string;
    inCharge: string;
    extraUrls: Array<{ label: string; url: string }>;
  } {
    const extraUrls = [
      {
        label: "Course Catalog",
        url: `http://student.mit.edu/catalog/search.cgi?search=${this.number}`,
      },
      {
        label: "Class Evaluations",
        url: `https://sisapp.mit.edu/ose-rpt/subjectEvaluationSearch.htm?search=Search&subjectCode=${this.number}`,
      },
    ];

    if (this.rawClass.u) {
      extraUrls.unshift({ label: "More Info", url: this.rawClass.u });
    }
    if (this.course === "6") {
      extraUrls.push({
        label: "HKN Underground Guide",
        url: `https://underground-guide.mit.edu/search?q=${this.number}`,
      });
    }
    if (this.course === "18") {
      extraUrls.push({
        label: "Course 18 Undeground Guide",
        url: `http://course18.guide/${this.number}-spring-2021.html`,
      });
    }

    return {
      description: this.rawClass.d,
      inCharge: this.rawClass.i,
      extraUrls: extraUrls,
    };
  }

  /** Doesn't actually do anything (yet?), just makes compiler happy. */
  addTimeslot(startDate: Date, endDate: Date): void {}

  /** Doesn't actually do anything (yet?), just makes compiler happy. */
  removeTimeslot(slot: Timeslot): void {}

  /** Deflate a class to something JSONable. */
  deflate(): any {
    const sections = this.sections.map((secs) =>
      !secs.locked
        ? null
        : secs.sections.findIndex((sec) => sec === secs.selected)
    );
    while (sections.at(-1) === null) sections.pop();
    return [
      this.number,
      ...(this.manualColor ? [this.backgroundColor] : []), // string
      ...(sections.length > 0 ? sections : []), // number
    ];
  }

  /**
   * Inflate a class with info from the output of deflate.
   *
   * TODO: it's possible that sections change between when this class was
   * serialized and when it becomes parsed; we currently don't guard that.
   */
  inflate(parsed: any): void {
    if (typeof parsed === "string") {
      // just the class number, ignore
      return;
    }
    // we ignore parsed[0] as that has the class number
    let offset = 1;
    if (typeof parsed[1] === "string") {
      offset += 1;
      this.backgroundColor = parsed[1];
      this.manualColor = true;
    }
    this.sections.forEach((secs, i) => {
      const parse = parsed[i + offset];
      if (!parse && parse !== 0) {
        secs.locked = false;
      } else {
        secs.locked = true;
        secs.selected = secs.sections[parse];
      }
    });
  }
}
