import { EventInput } from "@fullcalendar/core";
import { nanoid } from "nanoid";

import { Class } from "./class";
import { TColorScheme, fallbackColor } from "./colors";
import { Slot } from "./dates";
import { RawTimeslot } from "./rawClass";
import { sum } from "./utils";

/** A period of time, spanning several Slots. */
export class Timeslot {
  startSlot: Slot;
  numSlots: number;

  constructor(startSlot: number, numSlots: number) {
    this.startSlot = Slot.fromSlotNumber(startSlot);
    this.numSlots = numSlots;
  }

  /** Construct a timeslot from [startSlot, endSlot). */
  static fromStartEnd(startSlot: Slot, endSlot: Slot): Timeslot {
    return new Timeslot(startSlot.slot, endSlot.slot - startSlot.slot);
  }

  /** The first slot after this Timeslot, or the exclusive end slot. */
  get endSlot(): Slot {
    return this.startSlot.add(this.numSlots);
  }

  /** The start time, on the week of 2001-01-01. */
  get startTime(): Date {
    return this.startSlot.startDate;
  }

  /** The end time, on the week of 2001-01-01. */
  get endTime(): Date {
    return this.endSlot.startDate;
  }

  /** The number of hours this timeslot spans. */
  get hours(): number {
    return this.numSlots / 2;
  }

  /**
   * @param other - timeslot to compare to
   * @returns True if this timeslot conflicts with the other timeslot
   */
  conflicts(other: Timeslot): boolean {
    return (
      this.startSlot.slot <= other.endSlot.slot &&
      other.startSlot.slot <= this.endSlot.slot
    );
  }

  /** Convert to string of the form "Mon, 9:30 AM – 11:00 AM". */
  toString(): string {
    return `${this.startSlot.dayString}, ${this.startSlot.timeString} – ${this.endSlot.timeString}`;
  }

  /** @returns True if this timeslot is equal to other timeslot */
  equals(other: Timeslot): boolean {
    return this.startSlot === other.startSlot && this.endSlot === other.endSlot;
  }
}

/**
 * A group of events to be rendered in a calendar, all of the same name, room,
 * and color.
 */
export class Event {
  /** The parent activity owning the event. */
  activity: Activity;
  /** The name of the event. */
  name: string;
  /** All slots of the event. */
  slots: Array<Timeslot>;
  /** The room of the event. */
  room: string | undefined;
  /** If defined, 1 -> first half; 2 -> second half. */
  half: number | undefined;

  constructor(
    activity: Activity,
    name: string,
    slots: Array<Timeslot>,
    room: string | undefined = undefined,
    half: number | undefined = undefined,
  ) {
    this.activity = activity;
    this.name = name;
    this.slots = slots;
    this.room = room;
    this.half = half;
  }

  /** List of events that can be directly given to FullCalendar. */
  get eventInputs(): Array<EventInput> {
    const color = this.activity.backgroundColor;
    return this.slots.map((slot) => ({
      title: this.name,
      start: slot.startTime,
      end: slot.endTime,
      backgroundColor: color,
      borderColor: color,
      room: this.room,
      activity: this.activity,
    }));
  }
}

/** A non-class activity. */
export class NonClass {
  /** ID unique over all Activities. */
  readonly id: string;
  name: string = "New Activity";
  /** The background color for the activity, used for buttons and calendar. */
  backgroundColor: string;
  /** Is the color set by the user (as opposed to chosen automatically?) */
  manualColor: boolean = false;
  timeslots: Array<Timeslot> = [];

  constructor(colorScheme: TColorScheme) {
    this.id = nanoid(8);
    this.backgroundColor = fallbackColor(colorScheme);
  }

  /** Name that appears when it's on a button. */
  get buttonName(): string {
    return this.name;
  }

  /** Hours per week. */
  get hours(): number {
    return sum(this.timeslots.map((slot) => slot.hours));
  }

  /** Get all calendar events corresponding to this activity. */
  get events(): Array<Event> {
    return [new Event(this, this.name, this.timeslots)];
  }

  /**
   * Add a timeslot to this non-class activity spanning from startDate to
   * endDate. Dates must be within 8 AM to 9 PM. Will not add if equal to
   * existing timeslot. Will not add if slot spans multiple days.
   */
  addTimeslot(slot: Timeslot): void {
    if (
      this.timeslots.find((slot_) => slot_.equals(slot)) ||
      slot.startTime.getDate() !== slot.endTime.getDate()
    )
      return;
    this.timeslots.push(slot);
  }

  /** Remove a given timeslot from the non-class activity. */
  removeTimeslot(slot: Timeslot): void {
    this.timeslots = this.timeslots.filter((slot_) => !slot_.equals(slot));
  }

  /** Deflate an activity to something JSONable. */
  deflate(): Array<Array<RawTimeslot> | string> {
    const res = [
      this.timeslots.map<RawTimeslot>((slot) => [
        slot.startSlot.slot,
        slot.numSlots,
      ]),
      this.name,
    ];
    if (this.manualColor) {
      res.push(this.backgroundColor);
    }
    return res;
  }

  /** Inflate a non-class activity with info from the output of deflate. */
  inflate(parsed: Array<Array<RawTimeslot> | string>): void {
    const [timeslots, name, backgroundColor] = parsed;
    this.timeslots = (timeslots as Array<RawTimeslot>).map(
      (slot) => new Timeslot(...slot)
    );
    this.name = name as string;
    if (backgroundColor) {
      this.backgroundColor = backgroundColor as string;
    }
  }
}

/** Shared interface for Class and NonClass. */
export type Activity = Class | NonClass;
