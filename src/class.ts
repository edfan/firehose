import { EventInput } from "@fullcalendar/core";

import { formatNumber } from "./utils";

/** Raw timeslot format: [start slot, length of timeslot]. */
type RawTimeslot = [number, number];

/** Raw section format: [[[10, 2], [70, 2]], "34-101". */
type RawSection = [Array<RawTimeslot>, string];

enum SectionKind {
  LECTURE = "l",
  RECITATION = "r",
  LAB = "b",
}

/** The raw class format produced by combiner_ws.py. */
export type RawClass = {
  /** Class number, e.g. "6.036" */
  no: string;
  /** Course number, e.g. "6" */
  co: string;
  /** Class number without course, e.g. "036" */
  cl: string;
  /** True if some section is not scheduled yet */
  tb: boolean;

  /** Kinds of sections (among LECTURE, RECITATION, LAB) that exist */
  s: Array<SectionKind>;
  /** Possible lecture sections */
  l: Array<RawSection>;
  /** Possible recitation sections */
  r: Array<RawSection>;
  /** Possible lab sections */
  b: Array<RawSection>;
  /** Raw lecture times, e.g. T9.301-11 or TR1,F2 */
  lr: string;
  /** Raw recitation times, e.g. T9.301-11 or TR1,F2 */
  rr: string;
  /** Raw lab times, e.g. T9.301-11 or TR1,F2 */
  br: string;

  /** True if HASS-H */
  hh: boolean;
  /** True if HASS-A */
  ha: boolean;
  /** True if HASS-S */
  hs: boolean;
  /** True if HASS-E */
  he: boolean;
  /** True if CI-H */
  ci: boolean;
  /** True if CI-HW */
  cw: boolean;
  /** True if REST */
  re: boolean;
  /** True if institute lab */
  la: boolean;
  /** True if partial institute lab */
  pl: boolean;

  /** Lecture or recitation units */
  u1: number;
  /** Lab or field work units */
  u2: number;
  /** Outside class units */
  u3: number;

  /** Level: "U" undergrad, "G" grad */
  le: "U" | "G";
  /**
   * Comma-separated list of classes with same number, e.g.
   * "21A.103, WGS.225"
   */
  sa: string;
  /** Comma-separated list of classes it meets with */
  mw: string;

  /** Terms class is offered */
  t: Array<"FA" | "JA" | "SP" | "SU">;
  /** Prereqs, no specific format (but usually contains class numbers) */
  pr: string;

  /** Description (~paragraph that appears in catalog) */
  d: string;
  /** Name of class e.g. "Algebra I" */
  n: string;
  /** (Person) in-charge, e.g. "Alyssa Hacker" */
  i: string;

  /** True if meeting virtually */
  v: boolean;

  /** True if NOT offered next year */
  nx: boolean;
  /** True if can be repeated for credit */
  rp: boolean;
  /** Class website */
  u: string;
  /** True if has final */
  f: boolean;

  /** Rating (out of 7.0) from evals */
  ra: number;
  /** Hours per week from evals */
  h: number;
  /** Class size from evals */
  si: number;
};

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
};

/**
 * A timeslot is a period of time, spanning several thirty-minute slots. Each
 * day has 30 thirty-minute slots from 8 AM to 11 PM, times five days a week.
 * Thus, Monday slots are 0 to 29, Tuesday are 30 to 59, etc.
 */
export class Timeslot {
  startSlot: number;
  numSlots: number;

  constructor(timeslot: RawTimeslot) {
    [this.startSlot, this.numSlots] = timeslot;
  }

  get endSlot(): number {
    return this.startSlot + this.numSlots - 1;
  }

  /**
   * @param other - timeslot to compare to
   * @returns True if this timeslot conflicts with the other timeslot
   */
  conflicts(other: Timeslot): boolean {
    return this.startSlot <= other.endSlot && other.startSlot <= this.endSlot;
  }
}

/**
 * A section is an array of timeslots that meet in the same room for the same
 * purpose. Sections can be lectures, recitations, or labs, for a given class.
 */
export class Section {
  /** Class this section belongs to */
  cls: Class;
  /** Index among sections of the same kind, e.g. 0th LAB, 1st LAB, etc. */
  index: number;
  /** Is it LECTURE, RECITATION, or LAB? */
  kind: SectionKind;
  /** Timeslots this section meets */
  timeslots: Array<Timeslot>;
  /** Room this section meets in */
  room: string;

  /**
   * @param cls - Class this section belongs to
   * @param index - Index among sections of the same kind
   * @param kind - LECTURE, RECITATION, or LAB
   * @param section - raw section info (timeslot and room)
   */
  constructor(
    cls: Class,
    index: number,
    kind: SectionKind,
    section: RawSection
  ) {
    this.cls = cls;
    this.index = index;
    this.kind = kind;
    const [rawSlots, room] = section;
    this.timeslots = rawSlots.map((slot) => new Timeslot(slot));
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

/** Wrapper for an array of {@link Section}s, all the same kind. */
export class Sections {
  cls: Class;
  kind: SectionKind;
  sections: Array<Section>;

  constructor(cls: Class, kind: SectionKind, secs: Array<RawSection>) {
    this.cls = cls;
    this.kind = kind;
    this.sections = secs.map((sec, i) => new Section(cls, i, kind, sec));
  }
}

/**
 * A group of events to be rendered in a calendar, all of the same name, room,
 * and color.
 */
class Event {
  /** The name of the event. */
  name: string;
  /** All slots of the event. */
  slots: Array<Timeslot>;
  /** The room of the event. */
  room: string | undefined;
  /** The event's background color. */
  backgroundColor: string;
  /** The event's border color. */
  borderColor: string;

  constructor(
    name: string,
    slots: Array<Timeslot>,
    room: string | undefined,
    backgroundColor: string,
    borderColor: string
  ) {
    this.name = name;
    this.slots = slots;
    this.room = room;
    this.backgroundColor = backgroundColor;
    this.borderColor = borderColor;
  }

  /** @returns List of events that can be directly given to FullCalendar. */
  get eventInputs(): Array<EventInput> {
    // TODO: compute from slots
    return [
      {
        title: this.name,
        start: new Date(),
        end: new Date(),
        backgroundColor: this.backgroundColor,
        borderColor: this.borderColor,
        room: this.room,
      },
    ];
  }
}

/** An entire class, e.g. 6.036, and its selected sections. */
export class Class {
  /** The RawClass being wrapped around. */
  rawClass: RawClass;
  /**
   * Map from SectionKind to whether that SectionKind is locked, i.e. not auto.
   * None counts as locked.
   */
  lockedSections: Map<SectionKind, boolean>;
  /** Map from SectionKind to currently scheduled section. None is null. */
  currentSections: Map<SectionKind, Section | null>;

  constructor(
    rawClass: RawClass,
    lockedSections?: Map<SectionKind, boolean>,
    currentSections?: Map<SectionKind, Section | null>
  ) {
    this.rawClass = rawClass;
    this.lockedSections = lockedSections ?? new Map();
    this.currentSections = currentSections ?? new Map();
  }

  /** Name, e.g. "Introduction to Machine Learning". */
  get name(): string {
    return this.rawClass.n;
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
  get hours(): { hours: number; setToUnits: boolean } {
    const setToUnits = !this.rawClass.h;
    return {
      hours: setToUnits ? this.totalUnits : this.rawClass.h,
      setToUnits,
    };
  }

  /** Array of section kinds: [LECTURE, RECITATION, LAB]. */
  get sectionKinds(): Array<SectionKind> {
    const map = {
      l: SectionKind.LECTURE,
      r: SectionKind.RECITATION,
      b: SectionKind.LAB,
    };
    return this.rawClass.s.map((kind) => map[kind]);
  }

  /**
   * @param kind - LECTURE, RECITATION, or LAB
   * @returns all sections with that kind
   */
  sectionsOfKind(kind: SectionKind): Sections {
    return new Sections(this, kind, this.rawClass[kind]);
  }

  /** All class sections */
  get sections(): Array<Sections> {
    return this.sectionKinds.map((kind) => this.sectionsOfKind(kind));
  }

  get events(): Array<Event> {
    // TODO: write based on currentSections
    return [];
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
        rating: `${formatNumber(this.rawClass.ra, 1)}/7.0`,
        hours: `${formatNumber(this.rawClass.h, 1)}`,
        people: `${formatNumber(this.rawClass.si, 1)}`,
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
}

// TODO: write
export class NonClass {
  get events(): Array<Event> {
    // TODO: write based on currentSections
    return [];
  }
}
