import { useState } from "react";

import { Class, NonClass, Flags, Section, Sections } from "./class";
import { Firehose } from "./firehose";

/** A small image indicating a flag, like Spring or CI-H. */
function TypeSpan(props: { flag: string; title: string }) {
  const { flag, title } = props;
  return (
    <span className="type-span" id={`${flag}-span`}>
      <img
        alt={title}
        height="16"
        width="16"
        src={`img/${flag}.gif`}
        data-toggle="tooltip"
        data-placement="top"
        title={title}
        data-trigger="hover"
      />
    </span>
  );
}

/** Header for class description; contains flags and related classes. */
function ClassTypes(props: { cls: Class }) {
  const { cls } = props;
  const { flags, totalUnits, units } = cls;

  /**
   * Wrap a group of flags in TypeSpans.
   *
   * @param arr - Arrays with [flag name, alt text].
   */
  const makeFlags = (arr: Array<[keyof Flags, string]>) =>
    arr
      .filter(([flag, _]) => flags[flag])
      .map(([flag, title]) => (
        <TypeSpan key={flag} flag={flag} title={title} />
      ));

  const types1 = makeFlags([
    ["nonext", "Not offered 2021-2022"],
    ["under", "Undergrad"],
    ["grad", "Graduate"],
  ]);

  const seasons = makeFlags([
    ["fall", "Fall"],
    ["iap", "IAP"],
    ["spring", "Spring"],
    ["summer", "Summer"],
  ])
    .map((tag) => [tag, ", "])
    .flat()
    .slice(0, -1);

  const types2 = makeFlags([
    ["repeat", "Can be repeated for credit"],
    ["rest", "REST"],
    ["Lab", "Institute Lab"],
    ["PartLab", "Partial Institute Lab"],
    ["hassH", "HASS-H"],
    ["hassA", "HASS-A"],
    ["hassS", "HASS-S"],
    ["hassE", "HASS-E"],
    ["cih", "CI-H"],
    ["cihw", "CI-HW"],
  ]);

  return (
    <p id="class-type">
      {types1} ({seasons}) {types2} {totalUnits} units: {units.join("-")}
      {flags.final ? (
        <span className="type-span" id="final-span">
          {" "}
          Has final
        </span>
      ) : null}
      <br />
    </p>
  );
}

/** List of related classes, appears after flags and before description. */
function ClassRelated(props: { cls: Class; firehose: Firehose }) {
  const { cls, firehose } = props;
  const { prereq, same, meets } = cls.related;

  /** Wrapper to link all classes in a given string. */
  const linkClasses = (str: string) =>
    str.split(/([ ,;[\]()])/).map((text) => {
      const cls = firehose.classes.get(text);
      if (!cls) return text;
      return (
        <span
          className="link-span"
          key={text}
          onClick={() => firehose.setViewedActivity(cls)}
        >
          {text}
        </span>
      );
    });

  return (
    <p id="class-type">
      <span id="class-prereq">Prereq: {linkClasses(prereq)}</span>
      {same ? (
        <span id="class-same">
          <br />
          Same class as: {linkClasses(same)}
        </span>
      ) : null}
      {meets ? (
        <span id="class-meets">
          <br />
          Meets with: {linkClasses(meets)}
        </span>
      ) : null}
    </p>
  );
}

/** Class evaluation info. */
function ClassEval(props: { cls: Class }) {
  const { cls } = props;
  const { rating, hours, people } = cls.evals;

  return (
    <p id="class-eval">
      Rating: {rating}&nbsp;&nbsp;&nbsp; Hours: {hours}&nbsp;&nbsp;&nbsp; Avg #
      of students: {people}
    </p>
  );
}

/** Class description, person in-charge, and any URLs afterward. */
function ClassBody(props: { cls: Class }) {
  const { cls } = props;
  const { description, inCharge, extraUrls } = cls.description;

  return (
    <p id="class-desc">
      {/* this is necessary as descriptions contain ampersand escapes like
          &nbsp. there's probably a better solution to this */}
      <span dangerouslySetInnerHTML={{ __html: description }} />
      <br />
      <br />
      {inCharge ? (
        <>
          <em>In-charge: {inCharge}</em>
          <br />
          <br />
        </>
      ) : null}
      {extraUrls
        .map<React.ReactNode>(({ label, url }) => (
          <a key={label} href={url}>
            {label}
          </a>
        ))
        .reduce((acc, cur) => [acc, " | ", cur])}
    </p>
  );
}

// TODO: docs
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

// TODO: docs
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

// TODO: docs
// TODO: factor out to own file?
function ClassButtons(props: { cls: Class; firehose: Firehose }) {
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
        <p id="manual-button" onClick={() => setShowManual(!showManual)}>
          {showManual
            ? "- Hide manual selection pane"
            : "+ Manually set sections"}
        </p>
        {showManual && <ClassManualSections cls={cls} firehose={firehose} />}
      </div>
    );
  }
}

// TODO: docs
function ClassDescription(props: { cls: Class; firehose: Firehose }) {
  const { cls, firehose } = props;

  return (
    <>
      <p id="class-name">
        {cls.number}: {cls.name}
      </p>
      <div id="flags-div">
        <ClassTypes cls={cls} />
        <ClassRelated cls={cls} firehose={firehose} />
        <ClassEval cls={cls} />
      </div>
      <ClassButtons cls={cls} firehose={firehose} />
      <ClassBody cls={cls} />
    </>
  );
}

/**
 * Full class description, from title to URLs at the end.
 * TODO: make activity buttons work nicely.
 * TODO: styling
 */
export function ActivityDescription(props: {
  activity: Class | NonClass;
  firehose: Firehose;
}) {
  const { activity, firehose } = props;

  return activity instanceof Class ? (
    <ClassDescription cls={activity} firehose={firehose} />
  ) : (
    <>
      <p id="class-name">{activity.name}</p>
      {/*<ActivityButtons activity={activity} firehose={firehose} />*/}
      <p id="class-desc">Your activity!</p>
    </>
  );
}
