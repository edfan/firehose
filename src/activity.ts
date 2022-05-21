import { EventInput } from "@fullcalendar/core";

import { Class, RawTimeslot } from "./class";
import {
  sum,
  toDate,
  slotToDayString,
  slotToTimeString,
  FALLBACK_COLOR,
} from "./utils";

/**
 * A timeslot is a period of time, spanning several thirty-minute slots. Each
 * day has 30 thirty-minute slots from 8 AM to 11 PM, times five days a week.
 *
 * Each slot is assigned a slot number. Monday slots are 0 to 29, Tuesday are
 * 30 to 59, etc., slot number 0 is Monday 8 AM to 8:30 AM, etc.
 *
 * Note that 8:30 AM is the ending time of slot number 0 and starting time of
 * slot number 1. Most timeslot utilities will convert a time to the slot
 * number that it starts, so 8:30 AM will be converted to 1.
 *
 * The interface ends at 9 PM, so we don't need to worry about the fencepost
 * problem with respect to ending slots.
 */
export class Timeslot {
  startSlot: number;
  numSlots: number;

  constructor(startSlot: number, numSlots: number) {
    this.startSlot = startSlot;
    this.numSlots = numSlots;
  }

  /** Construct a timeslot from [startSlot, endSlot). */
  static fromStartEnd(startSlot: number, endSlot: number): Timeslot {
    return new Timeslot(startSlot, endSlot - startSlot);
  }

  /** Ending slot, inclusive. */
  get endSlot(): number {
    return this.startSlot + this.numSlots - 1;
  }

  /** The start time, on the week of 2001-01-01. */
  get startTime(): Date {
    return toDate(this.startSlot);
  }

  /** The end time, on the week of 2001-01-01. */
  get endTime(): Date {
    return toDate(this.endSlot + 1);
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
    return this.startSlot <= other.endSlot && other.startSlot <= this.endSlot;
  }

  /** Convert to string of the form "Mon, 9:30 AM – 11:00 AM". */
  toString(): string {
    return `${slotToDayString(this.startSlot)}, ${slotToTimeString(
      this.startSlot
    )} – ${slotToTimeString(this.endSlot + 1)}`;
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

  constructor(
    activity: Activity,
    name: string,
    slots: Array<Timeslot>,
    room: string | undefined
  ) {
    this.activity = activity;
    this.name = name;
    this.slots = slots;
    this.room = room;
  }

  /** @returns List of events that can be directly given to FullCalendar. */
  get eventInputs(): Array<EventInput> {
    const color = this.activity.backgroundColor ?? FALLBACK_COLOR;
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
  /** Largest NonClass ID. */
  static maxId = 0;
  /** ID unique over all Activities. */
  readonly id: string;
  name: string = "New Activity";
  /** The background color for the activity, used for buttons and calendar. */
  backgroundColor: string | undefined = undefined;
  timeslots: Array<Timeslot> = [];

  constructor() {
    this.id = String(++NonClass.maxId);
  }

  /** Hours per week. */
  get hours(): number {
    return sum(this.timeslots.map((slot) => slot.hours));
  }

  /** Get all calendar events corresponding to this activity. */
  get events(): Array<Event> {
    return [new Event(this, this.name, this.timeslots, undefined)];
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
        slot.startSlot,
        slot.numSlots,
      ]),
      this.name,
    ];
    if (this.backgroundColor !== undefined) {
      res.push(this.backgroundColor);
    }
    return res;
  }

  /** Inflate a non-class activity with info from the output of deflate. */
  inflate(parsed: Array<Array<RawTimeslot> | string>) {
    const [timeslots, name, backgroundColor] = parsed;
    this.timeslots = (timeslots as Array<RawTimeslot>).map(
      (slot) => new Timeslot(...slot)
    );
    this.name = name as string;
    this.backgroundColor = backgroundColor as string;
  }
}

/** Shared interface for Class and NonClass. */
export type Activity = Class | NonClass;
