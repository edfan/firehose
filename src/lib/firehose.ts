import { nanoid } from "nanoid";

import { Timeslot, NonClass, Activity } from "./activity";
import { scheduleSlots } from "./calendarSlots";
import { Class, Section, SectionLockOption, Sections } from "./class";
import { Term } from "./dates";
import {
  ColorScheme,
  chooseColors,
  fallbackColor,
  colorSchemePresets,
} from "./colors";
import { RawClass } from "./rawClass";
import { Store } from "./store";
import { sum, urldecode, urlencode } from "./utils";

/** A save has an ID and a name. */
export type Save = {
  id: string;
  name: string;
};

/** React / localStorage state. */
export type FirehoseState = {
  selectedActivities: Array<Activity>;
  viewedActivity: Activity | undefined;
  selectedOption: number;
  totalOptions: number;
  units: number;
  hours: number;
  warnings: Array<string>;
  saveId: string;
  saves: Array<Save>;
  colorScheme: ColorScheme;
};

/**
 * Global Firehose object. Maintains global program state (selected classes,
 * schedule options selected, activities, etc.).
 */
export class Firehose {
  /** Map from class number to Class object. */
  classes: Map<string, Class>;
  /** Possible section choices. */
  options: Array<Array<Section>> = [[]];
  /** Current number of schedule conflicts. */
  conflicts: number = 0;
  /** Browser-specific saved state. */
  store: Store;

  // The following are React state, so should be private. Even if we pass the
  // Firehose object to React components, they shouldn't be looking at these
  // directly; they should have it passed down to them as props from App.
  //
  // All of our program state is on this level as well; a user's schedule is
  // determined by the current term (which determines rawClasses and therefore
  // classes), plus the selected activities. So to save/load schedules, all we
  // need is to save/load selected activities.

  /** Activity whose description is being viewed. */
  private viewedActivity: Activity | undefined;
  /** Selected class activities. */
  private selectedClasses: Array<Class> = [];
  /** Selected non-class activities. */
  private selectedNonClasses: Array<NonClass> = [];
  /** Selected schedule option; zero-indexed. */
  private selectedOption: number = 0;
  /** Currently loaded save slot, empty if none of them. */
  private saveId: string = "";
  /** Names of each save slot. */
  private saves: Array<Save> = [];
  /** Current color scheme. */
  private colorScheme: ColorScheme = colorSchemePresets[0];

  /** React callback to update state. */
  callback: ((state: FirehoseState) => void) | undefined;
  /** React callback to update fits schedule filter. */
  fitsScheduleCallback: (() => void) | undefined;

  constructor(
    rawClasses: Map<string, RawClass>,
    /** The current term object. */
    public readonly term: Term,
    /** String representing last update time. */
    public readonly lastUpdated: string,
    /** The latest term object. */
    public readonly latestTerm: Term
  ) {
    this.classes = new Map();
    this.store = new Store(term.toString());
    rawClasses.forEach((cls, number) => {
      this.classes.set(number, new Class(cls, this.colorScheme));
    });
    this.initState();
  }

  /** All activities. */
  get selectedActivities(): Array<Activity> {
    return [...this.selectedClasses, ...this.selectedNonClasses];
  }

  //========================================================================
  // Activity handlers

  /** Set the current activity being viewed. */
  setViewedActivity(activity: Activity | undefined): void {
    this.viewedActivity = activity;
    this.updateState();
  }

  /** @returns True if activity is one of the currently selected activities. */
  isSelectedActivity(activity: Activity): boolean {
    return this.selectedActivities.some(
      (activity_) => activity_.id === activity.id
    );
  }

  /**
   * Adds an activity, selects it, and updates.
   *
   * @param activity - Activity to be added. If null, creates a new NonClass
   *   and adds it.
   */
  addActivity(activity?: Activity): void {
    const toAdd = activity ?? new NonClass(this.colorScheme);
    this.setViewedActivity(toAdd);
    if (this.isSelectedActivity(toAdd)) return;
    if (toAdd instanceof Class) {
      this.selectedClasses.push(toAdd);
    } else {
      this.selectedNonClasses.push(toAdd);
    }
    this.updateActivities();
  }

  /** Remove an activity and update. */
  removeActivity(activity: Activity): void {
    if (!this.isSelectedActivity(activity)) return;
    if (activity instanceof Class) {
      this.selectedClasses = this.selectedClasses.filter(
        (activity_) => activity_.id !== activity.id
      );
    } else {
      this.selectedNonClasses = this.selectedNonClasses.filter(
        (activity_) => activity_.id !== activity.id
      );
    }
    this.updateActivities();
  }

  /** Add activity if it exists, remove if it doesn't. */
  toggleActivity(activity?: Activity): void {
    if (!activity) return;
    this.isSelectedActivity(activity)
      ? this.removeActivity(activity)
      : this.addActivity(activity);
  }

  /** Set the background color of an activity, then update. */
  setBackgroundColor(activity: Activity, color?: string): void {
    activity.backgroundColor = color ?? fallbackColor(this.colorScheme);
    activity.manualColor = Boolean(color);
    this.updateActivities();
  }

  /** Lock a specific section of a class. */
  lockSection(secs: Sections, sec: SectionLockOption): void {
    secs.lockSection(sec);
    this.updateActivities();
  }

  //========================================================================
  // NonClass handlers

  /** Rename a given non-activity. */
  renameNonClass(nonClass: NonClass, name: string): void {
    const nonClass_ = this.selectedNonClasses.find(
      (nonClass_) => nonClass_.id === nonClass.id
    )!;
    nonClass_.name = name;
    this.updateState();
  }

  /** Add the timeslot to currently viewed activity. */
  addTimeslot(nonClass: NonClass, slot: Timeslot): void {
    nonClass.addTimeslot(slot);
    this.updateActivities();
  }

  /** Remove all equal timeslots from currently viewed activity. */
  removeTimeslot(nonClass: NonClass, slot: Timeslot): void {
    nonClass.removeTimeslot(slot);
    this.updateActivities();
  }

  //========================================================================
  // State management

  /**
   * Update React state by calling React callback, and store state into
   * localStorage.
   */
  updateState(save: boolean = true): void {
    this.callback?.({
      selectedActivities: this.selectedActivities,
      viewedActivity: this.viewedActivity,
      selectedOption: this.selectedOption,
      totalOptions: this.options.length,
      units: sum(this.selectedClasses.map((cls) => cls.totalUnits)),
      hours: sum(this.selectedActivities.map((activity) => activity.hours)),
      warnings: Array.from(
        new Set(this.selectedClasses.flatMap((cls) => cls.warnings.messages))
      ),
      saveId: this.saveId,
      saves: this.saves,
      colorScheme: this.colorScheme,
    });
    if (save) {
      this.storeSave(this.saveId, false);
    }
  }

  /**
   * Change the current section of each class to match this.options[index].
   * If index does not exist, change it to this.options[0].
   */
  selectOption(index?: number): void {
    this.selectedOption = this.options[index ?? 0] ? index ?? 0 : 0;
    for (const sec of this.options[this.selectedOption]) {
      sec.secs.selected = sec;
    }
    this.updateState(false);
  }

  /**
   * Update selected activities: reschedule them and assign colors. Call after
   * every update of this.selectedClasses or this.selectedActivities.
   */
  updateActivities(save: boolean = true): void {
    chooseColors(this.selectedActivities, this.colorScheme);
    const result = scheduleSlots(this.selectedClasses, this.selectedNonClasses);
    this.options = result.options;
    this.conflicts = result.conflicts;
    this.selectOption();
    this.fitsScheduleCallback?.();
    if (save) this.storeSave(this.saveId);
  }

  /**
   * Does {@param cls} fit into current schedule without increasing conflicts?
   * Used for the "fits schedule" filter in ClassTable. Might be slow; careful
   * with using this too frequently.
   */
  fitsSchedule(cls: Class): boolean {
    return (
      !this.isSelectedActivity(cls) &&
      (cls.sections.length === 0 ||
        this.selectedClasses.length === 0 ||
        scheduleSlots(
          this.selectedClasses.concat([cls]),
          this.selectedNonClasses
        ).conflicts === this.conflicts)
    );
  }

  /** Set the color scheme. */
  setColorScheme(colorScheme: ColorScheme): void {
    this.colorScheme = colorScheme;
    chooseColors(this.selectedActivities, this.colorScheme);
    this.updateState();
  }

  //========================================================================
  // Loading and saving

  /** Clear (almost) all program state. This doesn't clear class state. */
  reset(): void {
    this.selectedClasses = [];
    this.selectedNonClasses = [];
    this.selectedOption = 0;
  }

  /** Deflate program state to something JSONable. */
  deflate(): any {
    return [
      this.selectedClasses.map((cls) => cls.deflate()),
      this.selectedNonClasses.length > 0
        ? this.selectedNonClasses.map((nonClass) => nonClass.deflate())
        : null,
      this.selectedOption,
    ];
  }

  /** Parse all program state. */
  inflate(obj: any[] | null): void {
    if (!obj) return;
    this.reset();
    const [classes, nonClasses, selectedOption] = obj;
    for (const deflated of classes) {
      const cls =
        typeof deflated === "string"
          ? this.classes.get(deflated)
          : this.classes.get(deflated[0]);
      if (!cls) continue;
      cls.inflate(deflated);
      this.selectedClasses.push(cls);
    }
    if (nonClasses) {
      for (const deflated of nonClasses) {
        const nonClass = new NonClass(this.colorScheme);
        nonClass.inflate(deflated);
        this.selectedNonClasses.push(nonClass);
      }
    }
    this.selectedOption = selectedOption ?? 0;
    this.saveId = "";
    this.updateActivities(false);
  }

  /** Attempt to load from a slot. Return whether it succeeds. */
  loadSave(id: string): void {
    // if we loaded from a url, clear the ?s= first
    const url = new URL(window.location.href);
    if (url.searchParams.has("s")) {
      url.searchParams.delete("s");
      window.history.pushState({}, "", url);
    }
    const storage = this.store.get(id);
    if (!storage) return;
    this.inflate(JSON.parse(storage));
    this.saveId = id;
    this.updateState(false);
  }

  /** Store state as a save in localStorage, and store save metadata. */
  storeSave(id?: string, update: boolean = true): void {
    if (id) {
      this.store.set(id, JSON.stringify(this.deflate()));
    }
    this.store.set("saves", JSON.stringify(this.saves));
    this.store.globalSet("colorScheme", JSON.stringify(this.colorScheme));
    if (update) {
      this.updateState(false);
    }
  }

  /** Add a new save. If reset, then make the new save blank. */
  addSave(reset: boolean): void {
    const id = nanoid(8);
    this.saveId = id;
    const name = `Schedule ${this.saves.length + 1}`;
    this.saves.push({ id, name });
    if (reset) this.reset();
    this.storeSave(id);
  }

  /** Rename a given save. */
  renameSave(id: string, name: string): void {
    const save = this.saves.find((save) => save.id === id);
    if (!save || !name) return;
    save.name = name;
    this.storeSave();
  }

  /** Remove the given slot.  */
  removeSave(id: string): void {
    this.saves = this.saves.filter((save) => save.id !== id);
    if (this.saves.length === 0) {
      this.addSave(true);
    }
    if (id === this.saveId) {
      this.loadSave(this.saves[0]!.id);
    }
    this.storeSave();
  }

  /** Return a URL that can be opened to recover the state. */
  urlify(): string {
    const encoded = urlencode(this.deflate());
    return `${document.location.origin}${document.location.pathname}?s=${encoded}`;
  }

  /** Initialize the state from either the URL or localStorage. */
  initState(): void {
    const colorScheme = this.store.globalGet("colorScheme");
    if (colorScheme) {
      this.colorScheme = JSON.parse(colorScheme) as ColorScheme;
    }
    const params = new URLSearchParams(document.location.search);
    const param = params.get("s");
    const saves = this.store.get("saves");
    if (saves) {
      this.saves = JSON.parse(saves) as Array<Save>;
    }
    if (!this.saves || !this.saves.length) {
      this.saves = [];
      this.addSave(true);
    }
    if (param) {
      this.inflate(urldecode(param));
    } else {
      this.loadSave(this.saves[0]!.id);
    }
  }
}
