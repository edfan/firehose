import * as ReactDOM from "react-dom";

import { ClassDescription } from "./ClassDescription";
import { RawClass, Class } from "./class";
import { selectSlots } from "./calendarSlots";

export function formatNumber(x: number, n: number) {
  const re = "\\d(?=(\\d{" + (x || 3) + "})+" + (n > 0 ? "\\." : "$") + ")";
  return x.toFixed(Math.max(0, ~~n)).replace(new RegExp(re, "g"), "$&,");
}

// "6.036", "5.5", "10.2", "Introduction to Machine Learning"
type EvalTableRow = [string, string, string, string];

export class Firehose {
  rawClasses: Map<string, RawClass>;
  evalTableRows: Array<EvalTableRow>;
  currentClasses: Array<Class> = [];

  constructor(rawClasses: Map<string, RawClass>) {
    this.rawClasses = rawClasses;
    this.evalTableRows = [];
    this.rawClasses.forEach((cls) => {
      this.evalTableRows.push([cls.no, formatNumber(cls.ra, 1), formatNumber(cls.h, 1), cls.n]);
    })
  }

  fillTable(isSelected: (cls: string) => boolean): Array<EvalTableRow> {
    return this.evalTableRows.filter(([cls]) => isSelected(cls));
  }

  addClass(number: string): void {
    this.currentClasses.push(new Class(this.rawClasses.get(number)!));
  }

  removeClass(number: string): void {
    this.currentClasses = this.currentClasses.filter((cls) => cls.number !== number);
  }

  selectSlots(lockedSlots: Map<string, string | number>): {
    allSections: Array<[string, string]>;
    options: Array<Array<number>>;
  } {
    return selectSlots(this.currentClasses, lockedSlots);
  }

  classDescription(number: string): void {
    const cls = new Class(this.rawClasses.get(number)!);
    ReactDOM.render(
      ClassDescription({ cls }),
      document.getElementById("desc-div")
    );
  }
}
