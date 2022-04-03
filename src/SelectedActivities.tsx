import { Class, NonClass } from "./class";
import { Firehose } from "./firehose";

// TODO: docs
// TODO: warnings, double click
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

// TODO: docs
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
            key={activity.name}
            activity={activity}
            firehose={firehose}
          />
        ))}
      </div>
      <p id="units-div">
        Units: {units}&nbsp;&nbsp;&nbsp;Hours:{" " + hours}
      </p>
      {warnings.map((warning) => (
        <p key={warning} id="warning-div">
          {warning}
        </p>
      ))}
    </div>
  );
}
