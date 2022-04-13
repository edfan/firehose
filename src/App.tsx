import { useEffect, useState } from "react";

import { Firehose, FirehoseState } from "./firehose";

import { Calendar } from "./Calendar";
import { ActivityDescription } from "./ActivityDescription";
import { ClassTable } from "./ClassTable";
import { AddNonClassActivity } from "./AddNonClassActivity";
import { SelectedActivities } from "./SelectedActivities";
import { Header } from "./Header";
import { LeftFooter, RightFooter } from "./Footers";

/** The main application. */
export function App(props: { firehose: Firehose }) {
  const { firehose } = props;
  const [state, setState] = useState<FirehoseState>({
    selectedActivities: [],
    viewedActivity: undefined,
    selectedOption: 0,
    totalOptions: 0,
    units: 0,
    hours: 0,
    warnings: [],
  });

  // Are we showing the non-class activity pane?
  const [showNonClass, setShowNonClass] = useState(false);

  useEffect(() => {
    firehose.callback = setState;
    firehose.updateState();
  }, [firehose]);

  return (
    <>
      <div id="left-div">
        <Calendar
          selectedActivities={state.selectedActivities}
          selectedOption={state.selectedOption}
          totalOptions={state.totalOptions}
          firehose={firehose}
        />
        <LeftFooter />
      </div>
      <div id="right-div">
        <Header />
        <hr />
        <SelectedActivities
          selectedActivities={state.selectedActivities}
          units={state.units}
          hours={state.hours}
          warnings={state.warnings}
          firehose={firehose}
        />
        <hr />
        <p
          id="more-filters-button"
          onClick={() => setShowNonClass(!showNonClass)}
          style={{ textAlign: "center" }}
        >
          {showNonClass ? "+ Add class" : "+ Add non-class activity"}
        </p>
        <ClassTable
          classes={firehose.classes} // this is a constant; no need to add to state
          firehose={firehose}
          hidden={showNonClass}
        />
        <AddNonClassActivity firehose={firehose} hidden={!showNonClass} />
        {state.viewedActivity ? (
          <ActivityDescription
            activity={state.viewedActivity}
            firehose={firehose}
          />
        ) : null}
        <hr />
        <RightFooter />
      </div>
    </>
  );
}
