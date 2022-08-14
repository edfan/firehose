import { useGoogleLogin } from "@react-oauth/google";

import { Activity } from "./activity";
import { CALENDAR_COLOR } from "./colors";
import { Term } from "./dates";

// https://github.com/edfan/firehose/blob/master/www/script.js
// https://github.com/google/google-api-javascript-client/blob/master/docs/batch.md

import { Firehose } from "./firehose";

function toEvents(
  activity: Activity,
  term: Term
): Array<gapi.client.calendar.Event> {
  return activity.events.flatMap((event) =>
    event.slots.map((slot) => ({
      summary: event.name,
      location: event.room,
      start: {
        // dateTime: term.startDateOf(slot.startSlot).toISOString(),
      },
      end: {
        // dateTime: term.startDateOf(slot.endSlot).toISOString(),
      },
      // recurrence: []
    }))
  );
}

/** Hook that returns an export calendar function. */
export function useCalendarExport(firehose: Firehose): () => void {
  /** Insert a new calendar for this semester. */
  const insertCalendar = async (): Promise<string> => {
    const calendarName = `Firehose ${firehose.term.niceName}`;
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
    // TODO
  };

  /** Create a new calendar and populate it. */
  const exportCalendar = async () => {
    const calendarId = await insertCalendar();
    await setCalendarBackground(calendarId);
    await addCalendarEvents(calendarId);
  };

  const onCalendarExport = useGoogleLogin({
    scope: "https://www.googleapis.com/auth/calendar",
    onSuccess: (tokenResponse) => {
      if (tokenResponse?.access_token) {
        gapi.client.setApiKey(process.env.REACT_APP_API_KEY!);
        gapi.client.load("calendar", "v3", exportCalendar);
      }
    },
  });

  return onCalendarExport;
}
