import ReactDOM from "react-dom/client";

import { Firehose } from "./firehose";
import { App } from "./App";

// TODO fetch this async inside firehose object, not here
// TODO show loading screen while fetching
fetch("full.json")
  .then((res) => res.json())
  .then((data) => {
    const classesMap = new Map(Object.entries(data.classes));
    const firehose = new Firehose(classesMap, "f22");

    // Expose Firehose as global.
    window.firehose = firehose;

    ReactDOM.createRoot(document.querySelector("#App")).render(
      <App firehose={firehose} />
    );
  });
