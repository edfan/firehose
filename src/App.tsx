import { useEffect, useState } from "react";

import { Firehose, FirehoseState } from "./firehose";

import { Calendar } from "./Calendar";
import { ClassDescription } from "./ClassDescription";
import { ClassTable } from "./ClassTable";
import { CurrentActivities } from "./CurrentActivities";
import { Header } from "./Header";
import { LeftFooter, RightFooter } from "./Footers";

// TODO: docs
export function App(props: { firehose: Firehose }) {
  const { firehose } = props;
  const [state, setState] = useState<FirehoseState>({
    currentActivities: [],
    currentClass: undefined,
    units: 0,
    hours: 0,
    warnings: [],
  });

  useEffect(() => {
    firehose.callback = setState;
    firehose.updateState();
  }, [firehose]);

  return (
    <>
      <div id="left-div">
        <Calendar
          currentActivities={state.currentActivities}
          firehose={firehose}
        />
        <LeftFooter />
      </div>
      <div id="right-div">
        <Header />
        <hr />
        <CurrentActivities
          currentActivities={state.currentActivities}
          units={state.units}
          hours={state.hours}
          warnings={state.warnings}
          firehose={firehose}
        />
        <hr />
        <ClassTable
          classes={firehose.classes} // this is a constant; no need to add to state
          firehose={firehose}
        />
        {state.currentClass ? (
          <ClassDescription
            currentClass={state.currentClass}
            firehose={firehose}
          />
        ) : null}
        <hr />
        <RightFooter />
      </div>
    </>
  );
}
