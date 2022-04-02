import { Class, NonClass } from "./class";
import { Firehose } from "./firehose";

// TODO: docs
// TODO: style, onclick, on double click
function Activity(props: { activity: Class | NonClass; firehose: Firehose }) {
  return <div>{props.activity.name}</div>;
}

// TODO: docs
export function CurrentActivities(props: {
  currentActivities: Array<Class | NonClass>;
  units: number;
  hours: number;
  warnings: Array<string>;
  firehose: Firehose;
}) {
  const { currentActivities, units, hours, warnings, firehose } = props;

  return (
    <div id="selector-div">
      <p id="activity-button">+ Add non-class activity</p>
      <div id="selected-div">
        {currentActivities.map((activity) => (
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
