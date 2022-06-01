import ReactDOM from "react-dom";

import { Firehose } from "./firehose";
import { App } from "./App";

// TODO fetch this async inside firehose object, not here
// TODO show loading screen while fetching
fetch("full.json")
  .then((res) => res.json())
  .then((data) => {
    const classesMap = new Map(Object.entries(data.classes));
    const firehose = new Firehose(classesMap);

    // Expose Firehose as global.
    window.firehose = firehose;

    // TODO switch to react 18 eventually (ag-grid doesn't like it yet)
    ReactDOM.render(
      <App firehose={firehose} />,
      document.querySelector("#App")
    );
  });
