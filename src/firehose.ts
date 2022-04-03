import { RawClass, Class, NonClass, Section, Sections } from "./class";
import { scheduleSlots } from "./calendarSlots";

/**
 * React / localStorage state.
 */
export type FirehoseState = {
  selectedActivities: Array<Class | NonClass>;
  viewedActivity: Class | NonClass | undefined;
  selectedOption: number;
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

  /** Activity whose description is being viewed. */
  private viewedActivity: Class | NonClass | undefined;
  /** Selected class activities. */
  private selectedClasses: Array<Class> = [];
  /** Selected non-class activities. */
  private selectedNonClasses: Array<NonClass> = [];
  /** Selected schedule option; zero-indexed. */
  private selectedOption: number = 0;

  /** React callback to update state. */
  callback: ((state: FirehoseState) => void) | undefined;

  constructor(rawClasses: Map<string, RawClass>) {
    this.classes = new Map();
    rawClasses.forEach((cls, number) => {
      this.classes.set(number, new Class(cls));
    });
  }

  /** All activities. */
  get selectedActivities(): Array<Class | NonClass> {
    return [...this.selectedClasses, ...this.selectedNonClasses];
  }

  /** Update React state by calling React callback. */
  updateState(): void {
    this?.callback?.({
      selectedActivities: this.selectedActivities,
      viewedActivity: this.viewedActivity,
      selectedOption: this.selectedOption,
      totalOptions: this.options.length,
      units: this.selectedClasses.reduce(
        (total, cls) => total + cls.totalUnits,
        0
      ),
      hours: this.selectedActivities.reduce(
        (total, activity) => total + activity.hours,
        0
      ),
      warnings: [], // TODO
    });
  }

  /** Set the current class description being viewed. */
  setViewedActivity(cls: Class | undefined): void {
    this.viewedActivity = cls;
    this.updateState();
  }

  /**
   * @returns True if cls is one of the currently selected classes.
   *
   * TODO: is it true that each class only has one instance? if so, this can
   * just be a === check
   */
  isSelectedClass(cls: Class): boolean {
    return this.selectedClasses.some((cls_) => cls_.number === cls.number);
  }

  /** Adds a {@param cls} and reschedules. */
  addClass(cls: Class): void {
    if (!this.isSelectedClass(cls)) this.selectedClasses.push(cls);
    this.scheduleSlots();
  }

  /** Removes a {@param cls} and reschedules. */
  removeClass(cls: Class): void {
    this.selectedClasses = this.selectedClasses.filter(
      (cls_) => cls_.number !== cls.number
    );
    this.scheduleSlots();
  }

  /**
   * Lock a specific section of a class. This is here because we need to update
   * the React state after doing this.
   */
  lockSection(secs: Sections, sec: Section | "auto" | "none"): void {
    if (sec === "auto") {
      secs.cls.lockedSections.set(secs.kind, false);
    } else if (sec === "none") {
      secs.cls.lockedSections.set(secs.kind, true);
      secs.cls.selectedSections.set(secs.kind, null);
    } else {
      secs.cls.lockedSections.set(secs.kind, true);
      secs.cls.selectedSections.set(secs.kind, sec);
    }
    this.scheduleSlots();
  }

  /** See {@link selectSlots}. */
  scheduleSlots(): void {
    this.options = scheduleSlots(this.selectedClasses);
    this.selectOption();
  }

  /**
   * Change the current section of each class to match this.options[index].
   * If index does not exist, change it to this.options[0].
   */
  selectOption(index?: number): void {
    this.selectedOption = index ?? 0;
    if (this.selectedOption >= this.options.length) {
      this.selectedOption = 0;
    }
    for (const sec of this.options[this.selectedOption]!) {
      sec.cls.selectedSections.set(sec.kind, sec);
    }
    this.updateState();
  }
}
