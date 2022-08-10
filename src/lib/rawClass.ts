/** Raw timeslot format: [start slot, length of timeslot]. */
export type RawTimeslot = [number, number];

/** Raw section format: [[[10, 2], [70, 2]], "34-101". */
export type RawSection = [Array<RawTimeslot>, string];

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
  s: Array<"l" | "r" | "b">;
  /** Lecture timeslots and rooms */
  l: Array<RawSection>;
  /** Recitation timeslots and rooms */
  r: Array<RawSection>;
  /** Lab timeslots and rooms */
  b: Array<RawSection>;
  /** Raw lecture times, e.g. T9.301-11 or TR1,F2 */
  lr: Array<string>;
  /** Raw recitation times, e.g. T9.301-11 or TR1,F2 */
  rr: Array<string>;
  /** Raw lab times, e.g. T9.301-11 or TR1,F2 */
  br: Array<string>;

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
  /** 1 or 2 if first / second half */
  hf: number | boolean;
  /** True if limited enrollment */
  lm: boolean;

  /** Rating (out of 7.0) from evals */
  ra: number;
  /** Hours per week from evals */
  h: number;
  /** Class size from evals */
  si: number;
};
