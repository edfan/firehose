import { RawClass, Class, NonClass, Section } from "./class";
import { selectSlots } from "./calendarSlots";

/**
 * React / localStorage state.
 */
export type FirehoseState = {
  currentActivities: Array<Class | NonClass>;
  currentClass: Class | undefined;
  currentOption: number;
  totalOptions: number;
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
  /** Current schedule option; zero-indexed. */
  private currentOption: number = 0;

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
      currentOption: this.currentOption,
      totalOptions: this.options.length,
      units: this.currentClasses.reduce(
        (total, cls) => total + cls.totalUnits,
        0
      ),
      hours: this.currentActivities.reduce(
        (total, activity) => total + activity.hours,
        0
      ),
      warnings: [], // TODO
    });
  }

  /** Set the current class description being viewed. */
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

  /** Adds a {@param cls} and reschedules. */
  addClass(cls: Class): void {
    if (!this.isCurrentClass(cls)) this.currentClasses.push(cls);
    this.selectSlots();
  }

  /** Removes a {@param cls} and reschedules. */
  removeClass(cls: Class): void {
    this.currentClasses = this.currentClasses.filter(
      (cls_) => cls_.number !== cls.number
    );
    this.selectSlots();
  }

  /** See {@link selectSlots}. */
  selectSlots(): void {
    this.options = selectSlots(this.currentClasses);
    this.setOption();
  }

  /**
   * Change the current section of each class to match this.options[index].
   * If index does not exist, change it to this.options[0].
   */
  setOption(index?: number): void {
    this.currentOption = index ?? 0;
    if (this.currentOption >= this.options.length) {
      this.currentOption = 0;
    }
    for (const sec of this.options[this.currentOption]!) {
      sec.cls.currentSections.set(sec.kind, sec);
    }
    this.updateState();
  }
}
