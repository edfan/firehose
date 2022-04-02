import FullCalendar from "@fullcalendar/react";
import timeGridPlugin from "@fullcalendar/timegrid";

import { Class, NonClass } from "./class";
import { Firehose } from "./firehose";

// TODO: docs
// TODO: click event
export function Calendar(props: {
  currentActivities: Array<Class | NonClass>;
  currentOption: number;
  totalOptions: number;
  firehose: Firehose;
}) {
  const { currentActivities, currentOption, totalOptions, firehose } = props;

  return (
    <>
      <div id="buttons-div">
        <button
          className="btn btn-sm btn-secondary"
          id="cal-left"
          onClick={() => firehose.setOption(currentOption - 1)}
        >
          &larr;
        </button>{" "}
        &nbsp;&nbsp;&nbsp;
        <span id="cal-options-1">
          {totalOptions > 0 ? currentOption + 1 : 0}
        </span>
        /<span id="cal-options-2">{totalOptions}</span>
        &nbsp;&nbsp;&nbsp;
        <button
          className="btn btn-sm btn-secondary"
          id="cal-right"
          onClick={() => firehose.setOption(currentOption + 1)}
        >
          &rarr;
        </button>
        {/* <div id="warning3-div" style="display: none;">Too many options? Use the "+ Manually set sections" button above the class description to lock recitation times.</div> */}
      </div>
      <div id="left-int-div">
        <div id="calendar">
          <FullCalendar
            plugins={[timeGridPlugin]}
            initialView="timeGridWeek"
            allDaySlot={false}
            dayHeaderFormat={{ weekday: "long" }}
            editable={false}
            events={currentActivities
              .flatMap((act) => act.events)
              .flatMap((event) => event.eventInputs)}
            headerToolbar={false}
            height="auto"
            // a date that is, conveniently enough, a monday
            initialDate="2001-01-01"
            slotMinTime="08:00:00"
            slotMaxTime="22:00:00"
            weekends={false}
          />
        </div>
      </div>
    </>
  );
}
