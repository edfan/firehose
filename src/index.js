import ReactDOM from "react-dom";

import { Firehose } from "./firehose";
import { App } from "./App";

// TODO import this global eventually (this changes per semester)
// eslint-disable-next-line
const classes_map = new Map(Object.entries(classes));
const firehose = new Firehose(classes_map);

// Expose Firehose as global.
window.firehose = firehose;

ReactDOM.render(<App firehose={firehose} />, document.querySelector("#App"));
