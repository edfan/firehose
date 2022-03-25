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
  currentClass: Class | undefined;

  constructor(rawClasses: Map<string, RawClass>) {
    this.classes = new Map();
    rawClasses.forEach((cls, number) => {
      this.classes.set(number, new Class(cls));
    });
  }

  /** Render the table listing all the classes. */
  fillTable(): void {
    ReactDOM.render(
      <ClassTable
        classes={this.classes}
        setCurrentClass={this.classDescription.bind(this)}
      />,
      document.getElementById("eval-table-div")
    );
  }

  /** @param cls - Class to add. */
  addClass(cls: Class): void {
    this.currentClasses.push(cls);
  }

  /** @param cls - Class to remove. */
  removeClass(cls: Class): void {
    this.currentClasses = this.currentClasses.filter(
      (cls_) => cls_.number !== cls.number
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

  /** Render the class description for a given class. */
  classDescription(cls: Class): void {
    this.currentClass = cls;
    ReactDOM.render(
      <ClassDescription
        cls={this.currentClass}
        setCurrentClass={this.classDescription_.bind(this)}
      />,
      document.getElementById("desc-div")
    );
  }

  classDescription_(number: string): void {
    const cls = this.classes.get(number);
    cls && this.classDescription(cls);
  }

  addClass_(number: string): void {
    const cls = this.classes.get(number);
    cls && this.addClass(cls);
  }

  removeClass_(number: string): void {
    const cls = this.classes.get(number);
    cls && this.removeClass(cls);
  }
}
