import {
  RawClass,
  Timeslot,
  Class,
  NonClass,
  Section,
  Sections,
} from "./class";
import { scheduleSlots } from "./calendarSlots";
import { chooseColors } from "./utils";

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
  selectable: boolean;
};

/**
 * Global Firehose object. Maintains global program state (selected classes,
 * schedule options selected, activities, etc.).
 *
 * TODO: serialize/deserialize into localStorage.
 * TODO: serialize into urls too?
 * TODO: rename class to activity when needed.
 */
export class Firehose {
  /** Map from class number to Class object. */
  classes: Map<string, Class>;
  /** Possible section choices. */
  options: Array<Array<Section>> = [[]];
  /** Current number of schedule conflicts. */
  conflicts: number = 0;

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
  /** React callback to update fits schedule filter. */
  fitsScheduleCallback: (() => void) | undefined;

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
    this.callback?.({
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
      selectable: this.viewedActivity instanceof NonClass,
    });
  }

  /** Set the current class description being viewed. */
  setViewedActivity(cls: Class | NonClass | undefined): void {
    this.viewedActivity = cls;
    this.updateState();
  }

  /** @returns True if cls is one of the currently selected classes. */
  isSelectedClass(cls: Class): boolean {
    return this.selectedClasses.some((cls_) => cls_.number === cls.number);
  }

  /** TODO */
  isSelectedNonClass(activity: NonClass): boolean {
    return this.selectedNonClasses.some(
      (activity_) => activity_.id === activity.id
    );
  }

  /** Adds a non-class, selects it, and updates. */
  addNonClass(activity?: NonClass): void {
    const nonClass = activity ?? new NonClass();
    this.selectedNonClasses.push(nonClass);
    this.setViewedActivity(nonClass);
    this.updateActivities();
  }

  /** TODO */
  renameNonClass(activity: NonClass, name: string): void {
    const nonClass = this.selectedNonClasses.find(
      (activity_) => activity_.id === activity.id
    )!;
    nonClass.name = name;
    this.updateState();
  }

  /** TODO */
  removeNonClass(activity: NonClass): void {
    this.selectedNonClasses = this.selectedNonClasses.filter(
      (activity_) => activity_.id !== activity.id
    )!;
    this.updateActivities();
    this.fitsScheduleCallback?.();
  }

  /** TODO */
  toggleNonClass(activity?: NonClass): void {
    if (!activity) return;
    this.isSelectedNonClass(activity)
      ? this.removeNonClass(activity)
      : this.addNonClass(activity);
  }

  /** TODO: reconsider class/nonclass distinction again... */
  removeActivity(activity: Class | NonClass): void {
    return activity instanceof Class
      ? this.removeClass(activity)
      : this.removeNonClass(activity);
  }

  /**
   * Add the timeslot to currently viewed activity. Both {@param startDate} and
   * {@param endDate} should be dates in the week of 2001-01-01, with times
   * between 8 AM and 9 PM. Will not add if equal to an existing timeslot.
   * Will not add if startDate and endDate are on different dates.
   *
   * TODO: incl. activity in params, change interface to slots...?
   */
  addTimeslot(startDate: Date, endDate: Date): void {
    if (startDate.getDate() !== endDate.getDate()) return;
    this.viewedActivity?.addTimeslot(startDate, endDate);
    this.updateActivities();
    this.fitsScheduleCallback?.();
  }

  /**
   * Remove all timeslots equal to {@param slot} from currently viewed activity.
   */
  removeTimeslot(slot: Timeslot): void {
    this.viewedActivity?.removeTimeslot(slot);
    this.updateActivities();
    this.fitsScheduleCallback?.();
  }

  /** Adds a {@param cls} and updates. */
  addClass(cls: Class): void {
    if (!this.isSelectedClass(cls)) this.selectedClasses.push(cls);
    this.updateActivities();
    this.fitsScheduleCallback?.();
  }

  /** Removes a {@param cls} and updates. */
  removeClass(cls: Class): void {
    this.selectedClasses = this.selectedClasses.filter(
      (cls_) => cls_.number !== cls.number
    );
    this.updateActivities();
    this.fitsScheduleCallback?.();
  }

  /** Add class if it exists, remove if it doesn't. */
  toggleClass(cls?: Class): void {
    if (!cls) return;
    this.isSelectedClass(cls) ? this.removeClass(cls) : this.addClass(cls);
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
    this.updateActivities();
  }

  /**
   * Update selected activities: reschedule them and assign colors. Call after
   * every update of this.selectedClasses or this.selectedActivities.
   *
   * TODO: measure performance; if it takes a hit, then add option to only
   *    reschedule slash recolor.
   */
  updateActivities(): void {
    chooseColors(this.selectedActivities);
    const result = scheduleSlots(this.selectedClasses, this.selectedNonClasses);
    this.options = result.options;
    this.conflicts = result.conflicts;
    this.selectOption();
  }

  /**
   * Change the current section of each class to match this.options[index].
   * If index does not exist, change it to this.options[0].
   */
  selectOption(index?: number): void {
    this.selectedOption = index ?? 0;
    if (this.selectedOption >= this.options.length || this.selectedOption < 0) {
      this.selectedOption = 0;
    }
    for (const sec of this.options[this.selectedOption]) {
      sec.cls.selectedSections.set(sec.kind, sec);
    }
    this.updateState();
  }

  /**
   * Does {@param cls} fit into current schedule without increasing conflicts?
   * Used for the "fits schedule" filter in ClassTable. Might be slow; careful
   * with using this too frequently.
   *
   * TODO: measure performance
   */
  fitsSchedule(cls: Class): boolean {
    return (
      !this.isSelectedClass(cls) &&
      (cls.sections.length === 0 ||
        this.selectedClasses.length === 0 ||
        scheduleSlots(
          this.selectedClasses.concat([cls]),
          this.selectedNonClasses
        ).conflicts === this.conflicts)
    );
  }
}
