import ReactDOM from "react-dom/client";

import { App } from "./components/App";
import { Term } from "./lib/dates";

const term = new Term({
  urlName: "f22",
  startDate: "2022-09-07",
  h1EndDate: "2022-10-28",
  h2StartDate: "2022-10-31",
  endDate: "2022-12-14",
  holidayDates: [
    "2022-09-23",
    "2022-10-10",
    "2022-10-11",
    "2022-11-11",
    "2022-11-24",
    "2022-11-25",
  ],
});

ReactDOM.createRoot(document.querySelector("#App")).render(<App term={term} />);
