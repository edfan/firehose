import FullCalendar, { EventApi } from "@fullcalendar/react";
import timeGridPlugin from "@fullcalendar/timegrid";
import interactionPlugin from "@fullcalendar/interaction";

import { Activity, NonClass, Timeslot } from "./activity";
import { Firehose } from "./firehose";
import { toSlot } from "./utils";

import "./Calendar.scss";

/**
 * Calendar showing all the activities, including the buttons on top that
 * change the schedule option selected.
 */
export function Calendar(props: {
  selectedActivities: Array<Activity>;
  selectedOption: number;
  totalOptions: number;
  viewedActivity: Activity | undefined;
  firehose: Firehose;
}) {
  const {
    selectedActivities,
    selectedOption,
    totalOptions,
    viewedActivity,
    firehose,
  } = props;

  const renderEvent = ({
    event,
    timeText,
  }: {
    event: EventApi;
    timeText: string;
  }) => {
    return (
      <div className="calendar-event">
        <div className="calendar-time">{timeText}</div>
        <div className="calendar-title">{event.title}</div>
        <div className="calendar-room">{event.extendedProps.room}</div>
      </div>
    );
  };

  return (
    <>
      <div id="buttons-div">
        <button
          className="btn btn-sm btn-secondary"
          id="cal-left"
          onClick={() => firehose.selectOption(selectedOption - 1)}
        >
          &larr;
        </button>{" "}
        &nbsp;&nbsp;&nbsp;
        <span id="cal-options-1">{selectedOption + 1}</span>/
        <span id="cal-options-2">{totalOptions}</span>
        &nbsp;&nbsp;&nbsp;
        <button
          className="btn btn-sm btn-secondary"
          id="cal-right"
          onClick={() => firehose.selectOption(selectedOption + 1)}
        >
          &rarr;
        </button>
        <div
          id="warning3-div"
          style={{ display: totalOptions > 15 ? "block" : "none" }}
        >
          Too many options? Use the "Edit sections" button above the class
          description.
        </div>
      </div>
      <div id="left-int-div">
        <div id="calendar">
          <FullCalendar
            plugins={[timeGridPlugin, interactionPlugin]}
            initialView="timeGridWeek"
            allDaySlot={false}
            dayHeaderFormat={{ weekday: "long" }}
            editable={false}
            events={selectedActivities
              .flatMap((act) => act.events)
              .flatMap((event) => event.eventInputs)}
            eventContent={renderEvent}
            eventClick={(e) => {
              // extendedProps: non-standard props of {@link Event.eventInputs}
              firehose.setViewedActivity(e.event.extendedProps.activity);
            }}
            headerToolbar={false}
            height="auto"
            // a date that is, conveniently enough, a monday
            initialDate="2001-01-01"
            slotDuration="00:30:00"
            slotMinTime="08:00:00"
            slotMaxTime="22:00:00"
            weekends={false}
            selectable={viewedActivity instanceof NonClass}
            select={(e) => {
              viewedActivity instanceof NonClass &&
                firehose.addTimeslot(
                  viewedActivity,
                  Timeslot.fromStartEnd(toSlot(e.start), toSlot(e.end))
                );
            }}
          />
        </div>
      </div>
    </>
  );
}
