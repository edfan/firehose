import { useState } from "react";

import { NonClass, Timeslot } from "./activity";
import { Class, Section, Sections } from "./class";
import { Firehose } from "./firehose";
import { WEEKDAY_STRINGS, TIMESLOT_STRINGS, dayStringToSlot } from "./utils";

/** A single, manual section option, under {@link ClassManualSections}. */
function ClassManualOption(props: {
  secs: Sections;
  sec: Section | "auto" | "none";
  firehose: Firehose;
}) {
  const { secs, sec, firehose } = props;
  const checked =
    sec instanceof Section
      ? secs.locked && secs.selected === sec
      : sec === "auto"
      ? !secs.locked
      : secs.selected === null;

  return (
    <>
      <input
        type="radio"
        className="man-button"
        checked={checked}
        onChange={() => {
          firehose.lockSection(secs, sec);
        }}
      />
      {sec instanceof Section
        ? sec.rawTime
        : sec === "auto"
        ? "Auto (default)"
        : "None"}
      <br />
    </>
  );
}

/** Div containing section manual selection interface. */
function ClassManualSections(props: { cls: Class; firehose: Firehose }) {
  const { cls, firehose } = props;

  const renderOptions = (secs: Sections) => {
    const options: Array<Section | "auto" | "none"> = [
      "auto",
      "none",
      ...secs.sections,
    ];
    return (
      <div>
        {secs.name}:
        <br />
        {options.map((sec, i) => (
          <ClassManualOption
            key={i}
            secs={secs}
            sec={sec}
            firehose={firehose}
          />
        ))}
      </div>
    );
  };

  return (
    <div id="manual-div">
      {cls.sections.map((secs) => (
        <div key={secs.kind}>{renderOptions(secs)}</div>
      ))}
    </div>
  );
}

/** Buttons in class description to add/remove class, and lock sections. */
export function ClassButtons(props: { cls: Class; firehose: Firehose }) {
  const { cls, firehose } = props;

  const [showManual, setShowManual] = useState(false);
  const isSelected = firehose.isSelectedActivity(cls);

  return (
    <div id="class-buttons-div">
      <button
        type="button"
        className="btn btn-primary"
        onClick={() => firehose.toggleActivity(cls)}
      >
        {isSelected ? "Remove class" : "Add class"}
      </button>
      {isSelected && (
        <button
          type="button"
          className={"btn btn-primary" + (showManual ? " active" : "")}
          onClick={() => setShowManual(!showManual)}
        >
          Edit sections
        </button>
      )}
      {isSelected && showManual && (
        <ClassManualSections cls={cls} firehose={firehose} />
      )}
    </div>
  );
}

/** Form to add a timeslot to a non-class. */
function NonClassAddTime(props: { activity: NonClass; firehose: Firehose }) {
  const { activity, firehose } = props;
  const [days, setDays] = useState(
    Object.fromEntries(WEEKDAY_STRINGS.map((day) => [day, false]))
  );
  const [times, setTimes] = useState({ start: "10:00 AM", end: "1:00 PM" });

  const timeDrop = (key: "start" | "end") => (
    <select
      value={times[key]}
      onChange={(e) => setTimes({ ...times, [key]: e.target.value })}
    >
      {TIMESLOT_STRINGS.map((time) => (
        <option key={time} value={time}>
          {time}
        </option>
      ))}
    </select>
  );

  return (
    <form
      className="add-time-form"
      onSubmit={(e) => {
        e.preventDefault();
        for (const day in days) {
          if (!days[day]) continue;
          firehose.addTimeslot(
            activity,
            Timeslot.fromStartEnd(
              dayStringToSlot(day, times.start),
              dayStringToSlot(day, times.end)
            )
          );
        }
      }}
    >
      <button className="btn btn-secondary" type="submit">Add time</button>{" "}
      {WEEKDAY_STRINGS.map((day) => (
        <label key={day}>
          <input
            type="checkbox"
            checked={days[day]}
            onChange={(e) => setDays({ ...days, [day]: e.target.checked })}
          />
          {day}
        </label>
      ))}
      {timeDrop("start")} – {timeDrop("end")}
    </form>
  );
}

/** Buttons in non-class description to rename it, or add/edit/remove timeslots. */
export function NonClassButtons(props: {
  activity: NonClass;
  firehose: Firehose;
}) {
  const { activity, firehose } = props;

  const [name, setName] = useState("");

  return (
    <>
      <button
        type="button"
        className="btn btn-primary"
        onClick={() => firehose.toggleActivity(activity)}
      >
        {firehose.isSelectedActivity(activity)
          ? "Remove activity"
          : "Add activity"}
      </button>
      <form
        className="non-class-form"
        onSubmit={(e) => {
          e.preventDefault();
          firehose.renameNonClass(activity, name);
          setName("");
        }}
      >
        <label>New name: </label>{" "}
        <input
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
        />
        <button className="btn btn-secondary" type="submit">Rename</button>
      </form>
      <div id="class-buttons-div">
        Click and drag on an empty time in the calendar to add the times for
        your activity.<br/>Or add one manually:
      </div>
      <NonClassAddTime activity={activity} firehose={firehose} />
    </>
  );
}
