import { Class, NonClass } from "./class";
import { Firehose } from "./firehose";
import { formatNumber } from "./utils";

/**
 * A button representing a single, selected activity.
 *
 * TODO: double click functionality
 * TODO: warning symbols like * and +
 */
function Activity(props: { activity: Class | NonClass; firehose: Firehose }) {
  const { activity, firehose } = props;
  return (
    <button
      type="button"
      className="btn btn-primary"
      onClick={() => firehose.setViewedActivity(activity)}
      style={{
        backgroundColor: activity.backgroundColor,
        borderColor: activity.backgroundColor,
        color: "white",
      }}
    >
      {activity instanceof Class ? activity.number : activity.name}
    </button>
  );
}

/**
 * List of selected activities; one button for each activity.
 *
 * TODO: make buttons draggable
 */
export function SelectedActivities(props: {
  selectedActivities: Array<Class | NonClass>;
  units: number;
  hours: number;
  warnings: Array<string>;
  firehose: Firehose;
}) {
  const { selectedActivities, units, hours, warnings, firehose } = props;

  return (
    <div id="selector-div">
      <p id="activity-button">+ Add non-class activity</p>
      <div id="selected-div">
        {selectedActivities.map((activity) => (
          <Activity
            key={activity instanceof Class ? activity.number : activity.id}
            activity={activity}
            firehose={firehose}
          />
        ))}
      </div>
      <p id="units-div">
        Units: {units}&nbsp;&nbsp;&nbsp;Hours: {formatNumber(hours, 1)}
      </p>
      {warnings.map((warning) => (
        <p key={warning} id="warning-div">
          {warning}
        </p>
      ))}
    </div>
  );
}
