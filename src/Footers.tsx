/**
 * The footer on the bottom of the calendar.
 *
 * TODO: implement functionality
 * TODO: make years independent
 */
export function LeftFooter() {
  return (
    <>
      <div id="export-div">
        {/* <span id="prereg-link">Preregister these classes!</span> */}
        <span id="clipboard-link">Text form</span> |{" "}
        <span id="toggle-css">Toggle high-contrast</span> |{" "}
        <span id="toggle-dark-mode">Toggle dark-mode</span> |{" "}
        <span id="clear-all">Clear all</span>
        <br />
        <span
          id="calendar-link"
          data-toggle="tooltip"
          data-placement="top"
          title="Make sure popups are enabled!"
          data-trigger="hover"
        >
          <img src="img/calendar-button.svg" alt="" />
        </span>
      </div>
      <div id="footer-div">
        &copy; 2021 <a href="mailto:edwardf@alum.mit.edu">Edward Fan</a>.
        High-contrast theme by Shannon Peng. Dark-mode by Mindren Lu. <br />
        Subject descriptions and evaluations are &copy; 2014-2021 Massachusetts
        Institute of Technology.
      </div>
    </>
  );
}

/** The footer on the bottom of the activity description. */
export function RightFooter() {
  return (
    <div id="info2-div">
      <p>
        Questions? Issues? Feedback?{" "}
        <a href="mailto:cjq@mit.edu">Send me an email!</a>
      </p>
      <p>
        Looking for the old Firehose? It's been moved{" "}
        <a href="https://firehose.guide/old_www/evaluations.html">here</a>.
      </p>
      <p>
        <a href="https://github.com/edfan/firehose">GitHub</a> |{" "}
        <a href="privacy.html">Privacy Policy</a>
      </p>
    </div>
  );
}
