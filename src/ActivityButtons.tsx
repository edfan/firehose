import { useState } from "react";

import { Class, Section, Sections } from "./class";
import { Firehose } from "./firehose";

/** A single, manual section option, under {@link ClassManualSections}. */
function ClassManualOption(props: {
  secs: Sections;
  sec: Section | "auto" | "none";
  firehose: Firehose;
}) {
  const { secs, sec, firehose } = props;
  const checked =
    sec instanceof Section
      ? secs.locked && secs.selected?.index === sec.index
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
      {sec instanceof Section ? sec.rawTime : sec}
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

  if (!firehose.isSelectedClass(cls)) {
    return (
      <div id="class-buttons-div">
        <button
          type="button"
          className="btn btn-primary"
          onClick={() => firehose.addClass(cls)}
        >
          Add class
        </button>
      </div>
    );
  } else {
    return (
      <div id="class-buttons-div">
        <button
          type="button"
          className="btn btn-primary"
          onClick={() => firehose.removeClass(cls)}
        >
          Remove class
        </button>
        <button
          type="button"
          className={"btn btn-primary" + (showManual ? " active" : "")}
          onClick={() => setShowManual(!showManual)}
        >
          Edit sections
        </button>
        {showManual && <ClassManualSections cls={cls} firehose={firehose} />}
      </div>
    );
  }
}
