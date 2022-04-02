import { RawClass, Class, NonClass, Section } from "./class";
import { selectSlots } from "./calendarSlots";

/**
 * React / localStorage state.
 */
export type FirehoseState = {
  currentActivities: Array<Class | NonClass>;
  currentClass: Class | undefined;
};

/**
 * Global Firehose object. Maintains global program state (selected classes,
 * schedule options selected, activities, etc.).
 *
 * TODO: serialize/deserialize into localStorage.
 * TODO: rename class to activity when needed.
 */
export class Firehose {
  /** Map from class number to Class object. */
  classes: Map<string, Class>;
  /** Possible section choices. */
  options: Array<Array<Section>> = [];

  /** Classes currently selected. */
  currentClasses: Array<Class> = [];
  /** Non-class activities. */
  currentNonClasses: Array<NonClass> = [];
  /** Class description currently being viewed. */
  currentClass: Class | undefined;
  /** React callback to update state. */
  callback: ((state: FirehoseState) => void) | undefined;

  constructor(rawClasses: Map<string, RawClass>) {
    this.classes = new Map();
    rawClasses.forEach((cls, number) => {
      this.classes.set(number, new Class(cls));
    });
  }

  /** All activities. */
  get currentActivities(): Array<Class | NonClass> {
    return [...this.currentClasses, ...this.currentNonClasses];
  }

  /** Update React state by calling React callback. */
  updateState(): void {
    this?.callback?.({
      currentActivities: this.currentActivities,
      currentClass: this.currentClass,
    });
  }

  /**
   * @returns True if cls is one of the currently selected classes.
   *
   * TODO: is it true that each class only has one instance? if so, this can
   * just be a === check
   */
  isCurrentClass(cls: Class): boolean {
    return this.currentClasses.some((cls_) => cls_.number === cls.number);
  }

  /** @param cls - Class to add. */
  addClass(cls: Class): void {
    if (!this.isCurrentClass(cls)) this.currentClasses.push(cls);
    this.updateState();
  }

  /** @param cls - Class to remove. */
  removeClass(cls: Class): void {
    this.currentClasses = this.currentClasses.filter(
      (cls_) => cls_.number !== cls.number
    );
    this.updateState();
  }

  /**
   * See {@link selectSlots}.
   *
   * TODO: sketch for new schedule model:
   *    - Each class has a map from SectionKind to whether it's locked.
   *    - Each class maintains its current sections, including locked ones.
   *    - allSections will no longer exist; instead options is maintained in
   *      global state, and is list of list of sections. (Section has the
   *      Class and SectionKind, so that's enough info to recover.)
   *    - setOption is a global that changes the current section of each class
   */
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
    this.updateState();
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
