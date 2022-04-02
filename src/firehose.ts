import { RawClass, Class, NonClass, Section } from "./class";
import { selectSlots } from "./calendarSlots";

/**
 * React / localStorage state.
 */
export type FirehoseState = {
  currentActivities: Array<Class | NonClass>;
  currentClass: Class | undefined;
  units: number;
  hours: number;
  warnings: Array<string>;
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

  // The following are React state, so should be private. Even if we pass the
  // Firehose object to React components, they shouldn't be looking at these
  // directly; they should have it passed down to them as props from App.
  // TODO: rename "current" as in currentClass and "current" as in
  //       currentClasses and currentNonClasses

  /** Class description currently being viewed. */
  private currentClass: Class | undefined;
  /** Classes currently selected. */
  private currentClasses: Array<Class> = [];
  /** Non-class activities. */
  private currentNonClasses: Array<NonClass> = [];

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

  /** Total number of selected class units. */
  get units(): number {
    return this.currentClasses.reduce(
      (total, cls) => total + cls.totalUnits,
      0
    );
  }

  /** Total number of selected activity hours. */
  get hours(): number {
    return this.currentActivities.reduce(
      (total, activity) => total + activity.hours,
      0
    );
  }

  /** Update React state by calling React callback. */
  updateState(): void {
    this?.callback?.({
      currentActivities: this.currentActivities,
      currentClass: this.currentClass,
      units: this.units,
      hours: this.hours,
      warnings: [], // TODO
    });
  }

  /** Render the class description for a given class. */
  setCurrentClass(cls: Class | undefined): void {
    this.currentClass = cls;
    this.updateState();
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
}
