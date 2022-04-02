import React, { useEffect, useState } from "react";

import { Firehose, FirehoseState } from "./firehose";

import { ClassDescription } from "./ClassDescription";
import { ClassTable } from "./ClassTable";

// TODO: docs
export function App(props: { firehose: Firehose }) {
  const { firehose } = props;
  const [state, setState] = useState<FirehoseState>({
    currentActivities: [],
    currentClass: undefined,
  });

  useEffect(() => {
    firehose.callback = setState;
    firehose.updateState();
  }, [firehose]);

  return (
    <>
      <ClassTable
        classes={firehose.classes}
        setCurrentClass={firehose.classDescription.bind(firehose)}
      />
      {firehose.currentClass ? (
        <ClassDescription cls={firehose.currentClass} firehose={firehose} />
      ) : null}
    </>
  );
}
