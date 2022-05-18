import { Activity, NonClass } from "./activity";
import { Class, Flags } from "./class";
import { Firehose } from "./firehose";

import { ClassButtons, NonClassButtons } from "./ActivityButtons";

/**
 * A small image indicating a flag, like Spring or CI-H.
 *
 * TODO: tooltips
 */
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

/** Full class description, from title to URLs at the end. */
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
 * Full non-class activity description, from title to timeslots.
 * TODO: should the labels here be moved slash should nonclassbuttons be named
 * something else?
 */
function NonClassDescription(props: {
  activity: NonClass;
  firehose: Firehose;
}) {
  const { activity, firehose } = props;

  return (
    <>
      <p id="class-name">{activity.name}</p>
      <NonClassButtons activity={activity} firehose={firehose} />
      {activity.timeslots.map((t) => (
        <p key={t.toString()}>
          <button onClick={() => firehose.removeTimeslot(activity, t)}>remove</button>{" "}
          {t.toString()}
        </p>
      ))}
    </>
  );
}

/**
 * Activity description, whether class or non-class.
 * TODO: styling
 */
export function ActivityDescription(props: {
  activity: Activity;
  firehose: Firehose;
}) {
  const { activity, firehose } = props;

  return activity instanceof Class ? (
    <ClassDescription cls={activity} firehose={firehose} />
  ) : (
    <NonClassDescription activity={activity} firehose={firehose} />
  );
}
