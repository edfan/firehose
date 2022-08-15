import { useGoogleLogin } from "@react-oauth/google";

import { Activity } from "./activity";
import { CALENDAR_COLOR } from "./colors";
import { Term } from "./dates";
import { Firehose } from "./firehose";

/** Timezone string. */
const TIMEZONE = "America/New_York";

/** Returns a date as an ISO string without a timezone. */
function toISOString(date: Date): string {
  const pad = (num: number) => num.toString().padStart(2, "0");
  return [
    date.getFullYear(),
    "-",
    pad(date.getMonth() + 1),
    "-",
    pad(date.getDate()),
    "T",
    pad(date.getHours()),
    ":",
    pad(date.getMinutes()),
    ":",
    pad(date.getSeconds()),
  ].join("");
}

/** Returns a date as an RRULE string without a timezone. */
function toRRuleString(date: Date): string {
  return Array.from(toISOString(date))
    .filter((char) => char !== "-" && char !== ":")
    .join("");
}

/** Return a list of events for an activity that happen on a given term. */
function toEvents(
  activity: Activity,
  term: Term
): Array<gapi.client.calendar.Event> {
  return activity.events.flatMap((event) =>
    event.slots.map((slot) => {
      const startDate = term.startDateFor(slot.startSlot);
      const startDateEnd = term.startDateFor(slot.endSlot);
      const endDate = term.endDateFor(slot.startSlot);
      const exDates = term.exDatesFor(slot.startSlot);
      const rDate = term.rDateFor(slot.startSlot);
      return {
        summary: event.name,
        location: event.room,
        start: { dateTime: toISOString(startDate), timeZone: TIMEZONE },
        end: { dateTime: toISOString(startDateEnd), timeZone: TIMEZONE },
        recurrence: [
          // for some reason, gcal wants UNTIL to be a date, not time
          `RRULE:FREQ=WEEKLY;UNTIL=${toRRuleString(endDate).split("T")[0]}`,
          `EXDATE;TZID=${TIMEZONE}:${exDates.map(toRRuleString).join(",")}`,
          rDate && `RDATE;TZID=${TIMEZONE}:${toRRuleString(rDate)}`,
        ].filter((t): t is string => t !== undefined),
      };
    })
  );
}

/** Hook that returns an export calendar function. */
export function useCalendarExport(
  firehose: Firehose,
  onSuccess?: () => void,
  onError?: () => void
): () => void {
  /** Insert a new calendar for this semester. */
  const insertCalendar = async (): Promise<string> => {
    const calendarName = `Firehose: ${firehose.term.niceName}`;
    const resp = await gapi.client.calendar.calendars.insert(
      {},
      { summary: calendarName }
    );
    return resp.result.id!;
  };

  /** Set the background of the calendar to the Firehose color. */
  const setCalendarBackground = async (calendarId: string) => {
    const resp = await gapi.client.calendar.calendarList.get({ calendarId });
    const calendar = resp.result;
    calendar.backgroundColor = CALENDAR_COLOR;
    await gapi.client.calendar.calendarList.update({
      calendarId: calendar.id!,
      colorRgbFormat: true,
      resource: calendar,
    });
  };

  /** Add the classes / non-classes to the calendar. */
  const addCalendarEvents = async (calendarId: string) => {
    const batch = gapi.client.newBatch();
    firehose.selectedActivities
      .flatMap((activity) => toEvents(activity, firehose.term))
      .forEach((resource) =>
        batch.add(
          gapi.client.calendar.events.insert({
            calendarId,
            resource,
          })
        )
      );
    await batch.then();
  };

  /** Create a new calendar and populate it. */
  const exportCalendar = async () => {
    const calendarId = await insertCalendar();
    await setCalendarBackground(calendarId);
    await addCalendarEvents(calendarId);
    onSuccess?.();
    window.open("https://calendar.google.com", "_blank");
  };

  /** Request permission and create calendar. */
  const onCalendarExport = useGoogleLogin({
    scope: "https://www.googleapis.com/auth/calendar",
    onSuccess: (tokenResponse) => {
      if (tokenResponse?.access_token) {
        gapi.client.setApiKey(process.env.REACT_APP_API_KEY!);
        gapi.client.load("calendar", "v3", exportCalendar);
      }
    },
    onError,
  });

  return onCalendarExport;
}
