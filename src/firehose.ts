import * as ReactDOM from "react-dom";
import { ClassDescription } from "./ClassDescription";
import { RawClass, Class } from "./class";
import { selectSlots } from "./calendarSlots";

/** Rounds {@param x} to {@param n} decimal places? */
export function formatNumber(x: number, n: number) {
  const re = "\\d(?=(\\d{" + (x || 3) + "})+" + (n > 0 ? "\\." : "$") + ")";
  return x.toFixed(Math.max(0, ~~n)).replace(new RegExp(re, "g"), "$&,");
}

/** Row in the class list table, [number, rating, hour, name]. */
type EvalTableRow = [string, string, string, string];

/**
 * Global Firehose object. Maintains global program state (selected classes,
 * schedule options selected, activities, etc.).
 */
export class Firehose {
  /**
   * Map from class number to RawClass object.
   * TODO: Make a function to get Class object from class number?
   */
  rawClasses: Map<string, RawClass>;
  /** Rows in the class list table. */
  evalTableRows: Array<EvalTableRow>;
  /**
   * Classes currently selected.
   * TODO: persist in localStorage.
   */
  currentClasses: Array<Class> = [];

  constructor(rawClasses: Map<string, RawClass>) {
    this.rawClasses = rawClasses;
    this.evalTableRows = [];
    this.rawClasses.forEach((cls) => {
      this.evalTableRows.push([
        cls.no,
        formatNumber(cls.ra, 1),
        formatNumber(cls.h, 1),
        cls.n,
      ]);
    });
  }

  /**
   * TODO: this is not the right way to do this; right now the filters of class
   *       number and flags are all separate.
   * @param isSelected - filter function
   * @returns Rows of class list table, filtered with isSelected.
   */
  fillTable(isSelected: (cls: string) => boolean): Array<EvalTableRow> {
    return this.evalTableRows.filter(([cls]) => isSelected(cls));
  }

  /** @param number - Class number to add. */
  addClass(number: string): void {
    this.currentClasses.push(new Class(this.rawClasses.get(number)!));
  }

  /** @param number - Class number to remove. */
  removeClass(number: string): void {
    this.currentClasses = this.currentClasses.filter(
      (cls) => cls.number !== number
    );
  }

  /** See {@link selectSlots}. */
  selectSlots(
    lockedSlots: Map<string, string | number>
  ): {
    allSections: Array<[string, string]>;
    options: Array<Array<number>>;
  } {
    return selectSlots(this.currentClasses, lockedSlots);
  }

  /**
   * Render the class description for a given number.
   * TODO: this should be component state, not a global function.
   */
  classDescription(number: string): void {
    const cls = new Class(this.rawClasses.get(number)!);
    ReactDOM.render(
      ClassDescription({ cls }),
      document.getElementById("desc-div")
    );
  }
}
