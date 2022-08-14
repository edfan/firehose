import ReactDOM from "react-dom/client";

import { App } from "./components/App";
import { Term } from "./lib/dates";

const term = new Term("f22");

ReactDOM.createRoot(document.querySelector("#App")).render(<App term={term} />);
