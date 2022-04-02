import FullCalendar from "@fullcalendar/react";
import timeGridPlugin from "@fullcalendar/timegrid";

import { Class, NonClass } from "./class";
import { Firehose } from "./firehose";

// TODO: docs
export function Calendar(props: {
  currentActivities: Array<Class | NonClass>;
  firehose: Firehose;
}) {
  const { currentActivities, firehose } = props;

  return (
    <>
      <div id="buttons-div">
        <button className="btn btn-sm btn-secondary" id="cal-left">
          &larr;
        </button>{" "}
        &nbsp;&nbsp;&nbsp;
        <span id="cal-options-1">0</span>/<span id="cal-options-2">0</span>
        &nbsp;&nbsp;&nbsp;
        <button className="btn btn-sm btn-secondary" id="cal-right">
          &rarr;
        </button>
        {/* <div id="warning3-div" style="display: none;">Too many options? Use the "+ Manually set sections" button above the class description to lock recitation times.</div> */}
      </div>
      <div id="left-int-div">
        <div id="calendar"></div>
      </div>
    </>
  );
}
