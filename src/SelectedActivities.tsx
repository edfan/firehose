import { Class } from "./class";
import { Activity } from "./activity";
import { Firehose } from "./firehose";
import { formatNumber } from "./utils";

/**
 * A button representing a single, selected activity.
 *
 * TODO: double click functionality
 * TODO: warning symbols like * and +
 */
function ActivityButton(props: { activity: Activity; firehose: Firehose }) {
  const { activity, firehose } = props;
  return (
    <button
      type="button"
      className="btn btn-primary"
      onClick={() => firehose.setViewedActivity(activity)}
      onDoubleClick={() => firehose.removeActivity(activity)}
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
  selectedActivities: Array<Activity>;
  units: number;
  hours: number;
  warnings: Array<string>;
  firehose: Firehose;
  showClassTable: boolean;
  setShowClassTable: () => void;
}) {
  const {
    selectedActivities,
    units,
    hours,
    warnings,
    firehose,
    showClassTable,
    setShowClassTable,
  } = props;

  return (
    <div id="selector-div">
      <p id="units-div">
        Units: {units}&nbsp;&nbsp;&nbsp;Hours: {formatNumber(hours, 1)}
      </p>
      {warnings.map((warning) => (
        <p key={warning} id="warning-div">
          {warning}
        </p>
      ))}
      <div id="selected-div">
        {selectedActivities.map((activity) => (
          <ActivityButton
            key={activity instanceof Class ? activity.number : activity.id}
            activity={activity}
            firehose={firehose}
          />
        ))}
        <button
          type="button"
          className={"btn btn-secondary" + (showClassTable ? " active" : "")}
          onClick={() => setShowClassTable()}
        >
          + Class
        </button>
        <button
          type="button"
          className="btn btn-secondary"
          onClick={() => firehose.addActivity()}
        >
          + Non-class
        </button>
      </div>
    </div>
  );
}
