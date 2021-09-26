var render, html; // make tsc accept these types

function formatNumber(x: number, n: number) {
  const re = "\\d(?=(\\d{" + (x || 3) + "})+" + (n > 0 ? "\\." : "$") + ")";
  return x.toFixed(Math.max(0, ~~n)).replace(new RegExp(re, "g"), "$&,");
}

// [start slot, length of slot], e.g. [6, 3]
type RawTimeslot = [number, number];

// list of timeslots, room
// e.g. [[[6, 3], [66, 3]], "34-101"
type RawSection = [Array<RawTimeslot>, string];

// following combiner_ws.py
type RawClass = {
  // no: "6.036", co: "6", cl: "036"
  no: string;
  co: string;
  cl: string;
  tb: boolean; // tba

  s: Array<string>; // subset of ["l", "r", "b"]
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

enum SectionKind {
  LECTURE = "l",
  RECITATION = "r",
  LAB = "b",
}

class Timeslot {
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

type Flags = {
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

class Section {
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

class Sections {
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
class Class {
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
}

// "6.036", "5.5", "10.2", "Introduction to Machine Learning"
type EvalTableRow = [string, string, string, string];

class Firehose {
  rawClasses: Map<string, RawClass>;
  evalTableRows: Array<EvalTableRow>;
  currentClasses: Array<Class> = [];

  constructor(rawClasses: Map<string, RawClass>) {
    this.rawClasses = rawClasses;
    this.evalTableRows = [];
    for (const cls of this.rawClasses.values()) {
      this.evalTableRows.push([cls.no, formatNumber(cls.ra, 1), formatNumber(cls.h, 1), cls.n]);
    }
  }

  fillTable(isSelected: (cls: string) => boolean): Array<EvalTableRow> {
    return this.evalTableRows.filter(([cls]) => isSelected(cls));
  }

  selectHelper(
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

      const { options: newOptions, minConflicts: newMinConflicts } = this.selectHelper(
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

      if (newMinConflicts == minConflicts) {
        options.push(...newOptions);
      }
    }

    return { options, minConflicts };
  }

  selectSlots(
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

    for (const cls of this.currentClasses) {
      for (const secs of cls.sections) {
        const key = `${cls.number},${secs.kind}`;
        const option = lockedSlots[key];
        if (option !== undefined && option !== "none") {
          const sec = secs.sections[option];
          lockedSections.push(secs);
          lockedOptions.push(sec);
          initialSlots.push(...sec.timeslots);
        } else {
          freeSections.push(secs);
        }
      }
    }

    const { options } = this.selectHelper(freeSections, initialSlots, [], 0, Infinity);

    return {
      allSections: [lockedSections, freeSections].flat().map((sec) => [sec.cls.number, sec.kind]),
      options: options.map((opt) => lockedOptions.concat(opt).map((sec) => sec.index)),
    };
  }

  addClass(number: string): void {
    this.currentClasses.push(new Class(this.rawClasses.get(number)));
  }

  removeClass(number: string): void {
    this.currentClasses = this.currentClasses.filter((cls) => cls.number !== number);
  }

  classDescription(number: string): void {
    const cls = new Class(this.rawClasses.get(number));
    render(
      html`<${ClassDescription} cls="${cls}" />`,
      document.getElementById("desc-div"),
      document.getElementById("desc-div-internal")
    );
  }
}

function TypeSpan(props: { flag: string; title: string }) {
  const { flag, title } = props;

  return html`
    <span class="type-span" id="${flag}-span">
      <img
        height="16"
        width="16"
        src="img/${flag}.gif"
        data-toggle="tooltip"
        data-placement="top"
        title="${title}"
        data-trigger="hover"
    /></span>
  `;
}

function ClassTypes(props: { cls: Class }) {
  const { cls } = props;
  const { flags, totalUnits, units } = cls;

  const makeFlags = (arr) =>
    arr
      .filter(([flag, title]) => flags[flag])
      .map(([flag, title]) => html`<${TypeSpan} key="${flag}" flag="${flag}" title="${title}" />`);

  const types1 = makeFlags([
    ["nonext", "Not offered 2021-2022"],
    ["under", "Undergrad"],
    ["grad", "Graduate"],
  ]);

  const seasons = makeFlags([
    ["fall", "Fall"],
    ["iap", "IAP"],
    ["spring", "Spring"],
    ["summer", "Summer"],
  ])
    .map((tag) => [tag, ", "])
    .flat()
    .slice(0, -1);

  const types2 = makeFlags([
    ["repeat", "Can be repeated for credit"],
    ["rest", "REST"],
    ["Lab", "Institute Lab"],
    ["PartLab", "Partial Institute Lab"],
    ["hassH", "HASS-H"],
    ["hassA", "HASS-A"],
    ["hassS", "HASS-S"],
    ["hassE", "HASS-E"],
    ["cih1", "CI-H"],
    ["cihw", "CI-HW"],
  ]);

  return html`
    <p id="class-type">
      ${types1} (${seasons}) ${types2} ${totalUnits} units: ${units.join("-")}
      <span id="class-units"></span>
      <span class="type-span" id="final-span" style="display: none"> Has final</span><br />
      <span id="class-prereq"></span>
      <span id="class-same"></span>
      <span id="class-meets"></span>
    </p>
  `;
}

function ClassDescription(props: { cls: Class }) {
  const { cls } = props;

  return html`
    <p id="class-name">${cls.number}: ${cls.name}</p>
    <div id="flags-div">
      <${ClassTypes} cls=${cls} />
      <p id="class-eval" style="display: none">
        Rating: <span id="class-rating"></span><span id="out-of-rating">/7.0</span> Hours:
        <span id="class-hours"></span> Avg # of students: <span id="class-people"></span>
      </p>
    </div>
    <div id="class-buttons-div"></div>
    <p id="manual-button" style="display: none">+ Manually set sections</p>
    <div id="manual-div" style="display: none">
      <div id="man-lec-div">
        Lecture:<br />
        <input type="radio" class="man-button" id="lec-auto" name="lec" value="auto" /> Auto
        (default)<br />
        <input type="radio" class="man-button" id="lec-none" name="lec" value="none" /> None<br />
        <div id="spec-man-lec-div"></div>
      </div>
      <div id="man-rec-div">
        Recitation:<br />
        <input type="radio" class="man-button" id="rec-auto" name="rec" value="auto" /> Auto
        (default)<br />
        <input type="radio" class="man-button" id="rec-none" name="rec" value="none" /> None<br />
        <div id="spec-man-rec-div"></div>
      </div>
      <div id="man-lab-div">
        Lab:<br />
        <input type="radio" class="man-button" id="lab-auto" name="lab" value="auto" /> Auto
        (default)<br />
        <input type="radio" class="man-button" id="lab-none" name="lab" value="none" /> None<br />
        <div id="spec-man-lab-div"></div>
      </div>
    </div>
    <p id="class-desc"></p>
  `;
}
