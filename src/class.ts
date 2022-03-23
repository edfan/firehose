import { formatNumber } from "./firehose";

// [start slot, length of slot], e.g. [6, 3]
type RawTimeslot = [number, number];

// list of timeslots, room
// e.g. [[[6, 3], [66, 3]], "34-101"
type RawSection = [Array<RawTimeslot>, string];

enum SectionKind {
  LECTURE = "l",
  RECITATION = "r",
  LAB = "b",
}

// following combiner_ws.py
export type RawClass = {
  // no: "6.036", co: "6", cl: "036"
  no: string;
  co: string;
  cl: string;
  tb: boolean; // tba

  s: Array<SectionKind>; // subset of ["l", "r", "b"]
  l: Array<RawSection>; // lecture
  r: Array<RawSection>; // recitation
  b: Array<RawSection>; // lab
  // raw strings, e.g. T9.30-11 or TR1,F2
  lr: string;
  rr: string;
  br: string;

  // hass-h, hass-a, hass-s, hass-e
  hh: boolean;
  ha: boolean;
  hs: boolean;
  he: boolean;
  // ci-h, ci-hw
  ci: boolean;
  cw: boolean;
  // rest, lab, partial institute lab
  re: boolean;
  la: boolean;
  pl: boolean;

  // units of lecture, recitation, lab e.g. 5-0-7
  u1: number;
  u2: number;
  u3: number;

  // level: undergrad or grad
  le: "U" | "G";
  // comma-separated list of same classes
  // e.g. "21A.103, WGS.225"
  sa: string;
  // comma-separated list of meets with classes
  mw: string;

  // subset of ["FA", "JA", "SP", "SU"]
  t: Array<string>;
  // string describing prereqs
  // generally could be anything
  pr: string;

  d: string; // description
  n: string; // name
  i: string; // in-charge

  v: boolean; // virtual

  nx: boolean; // true if NOT offered next year
  rp: boolean; // can be repeated for credit
  u: string; // class url
  f: boolean; // has final

  ra: number; // rating from evals
  h: number; // hours from evals
  si: number; // size from evals
};

export class Timeslot {
  startSlot: number;
  numSlots: number;

  constructor(timeslot: RawTimeslot) {
    [this.startSlot, this.numSlots] = timeslot;
  }

  get endSlot(): number {
    return this.startSlot + this.numSlots - 1;
  }

  conflicts(other: Timeslot): boolean {
    return this.startSlot <= other.endSlot && other.startSlot <= this.endSlot;
  }
}

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
  hassH: boolean;
  hassA: boolean;
  hassS: boolean;
  hassE: boolean;
  cih1: boolean;
  cihw: boolean;
  final: boolean;
};

export class Section {
  cls: Class;
  index: number;
  kind: SectionKind;
  timeslots: Array<Timeslot>;
  room: string;

  constructor(cls: Class, index: number, kind: SectionKind, section: RawSection) {
    this.cls = cls;
    this.index = index;
    this.kind = kind;
    const [rawSlots, room] = section;
    this.timeslots = rawSlots.map((slot) => new Timeslot(slot));
    this.room = room;
  }

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

// rawClass wraper
export class Class {
  rawClass: RawClass;

  constructor(rawClass: RawClass) {
    this.rawClass = rawClass;
  }

  get name(): string {
    return this.rawClass.n;
  }

  get number(): string {
    return this.rawClass.no;
  }

  get course(): string {
    return this.rawClass.co;
  }

  get units(): Array<number> {
    return [this.rawClass.u1, this.rawClass.u2, this.rawClass.u3];
  }

  get totalUnits(): number {
    return this.rawClass.u1 + this.rawClass.u2 + this.rawClass.u3;
  }

  get hours(): { hours: number; setToUnits: boolean } {
    const setToUnits = !this.rawClass.h;
    return {
      hours: setToUnits ? this.totalUnits : this.rawClass.h,
      setToUnits,
    };
  }

  get sectionKinds(): Array<SectionKind> {
    const map = {
      l: SectionKind.LECTURE,
      r: SectionKind.RECITATION,
      b: SectionKind.LAB,
    };
    return this.rawClass.s.map((kind) => map[kind]);
  }

  sectionsOfKind(kind: SectionKind): Sections {
    return new Sections(this, kind, this.rawClass[kind]);
  }

  get sections(): Array<Sections> {
    return this.sectionKinds.map((kind) => this.sectionsOfKind(kind));
  }

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
      hassH: this.rawClass.hh,
      hassA: this.rawClass.ha,
      hassS: this.rawClass.hs,
      hassE: this.rawClass.he,
      cih1: this.rawClass.ci,
      cihw: this.rawClass.cw,
      final: this.rawClass.f,
    };
  }

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

  get description(): {
    description: string;
    inCharge: string;
    extraUrls: Array<{ label: string, url: string }>;
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
