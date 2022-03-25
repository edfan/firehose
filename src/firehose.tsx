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
  /** Map from class number to Class object. */
  classes: Map<string, Class>;
  /**
   * Classes currently selected.
   * TODO: persist in localStorage.
   */
  currentClasses: Array<Class> = [];
  /** Class description currently being viewed. */
  currentClass: Class | null = null;

  constructor(rawClasses: Map<string, RawClass>) {
    this.classes = new Map();
    rawClasses.forEach((cls, number) => {
      this.classes.set(number, new Class(cls));
    });
  }

  /** Render the table listing all the classes. */
  fillTable(): void {
    ReactDOM.render(
      <ClassTable classes={this.classes} />,
      document.getElementById("eval-table-div")
    );
  }

  /** @param number - Class number to add. */
  addClass(number: string): void {
    this.currentClasses.push(this.classes.get(number)!);
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
    ReactDOM.render(
      <ClassDescription cls={this.classes.get(number)!} />,
      document.getElementById("desc-div")
    );
  }
}
