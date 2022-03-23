import * as ReactDOM from "react-dom";
import { ClassDescription } from "./ClassDescription";
import { ClassTable } from "./ClassTable";
import { RawClass, Class } from "./class";
import { selectSlots } from "./calendarSlots";

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
  /**
   * Classes currently selected.
   * TODO: persist in localStorage.
   */
  currentClasses: Array<Class> = [];

  constructor(rawClasses: Map<string, RawClass>) {
    this.rawClasses = rawClasses;
  }

  /**
   * TODO: document
   */
  fillTable(): void {
    ReactDOM.render(
      <ClassTable rawClasses={this.rawClasses} />,
      document.getElementById("eval-table-div")
    );
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
      <ClassDescription cls={cls} />,
      document.getElementById("desc-div")
    );
  }
}
