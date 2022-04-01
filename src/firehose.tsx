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

  /** @returns True if cls is one of the currently selected classes. */
  isCurrentClass(cls: Class): boolean {
    return this.currentClasses.some((cls_) => cls_.number === cls.number);
  }

  /** @param cls - Class to add. */
  addClass(cls: Class): void {
    if (!this.isCurrentClass(cls)) this.currentClasses.push(cls);
    // manually update state for classDescription; TODO fix
    this.classDescription(this.currentClass);
  }

  /** @param cls - Class to remove. */
  removeClass(cls: Class): void {
    this.currentClasses = this.currentClasses.filter(
      (cls_) => cls_.number !== cls.number
    );
    // manually update state for classDescription; TODO fix
    this.classDescription(this.currentClass);
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
  classDescription(cls: Class | undefined): void {
    this.currentClass = cls;
    if (this.currentClass === undefined) return;
    ReactDOM.render(
      <ClassDescription cls={this.currentClass} firehose={this} />,
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
