import { Flex, Heading, Image, Link, Text, Tooltip } from "@chakra-ui/react";
import { decode } from "html-entities";

import { Activity, NonClass } from "./activity";
import { Class, Flags } from "./class";
import { Firehose } from "./firehose";

import { ClassButtons, NonClassButtons } from "./ActivityButtons";
import { linkClasses } from "./utils";
import { ReactNode } from "react";

/** A small image indicating a flag, like Spring or CI-H. */
function TypeSpan(props: { flag?: string; title: string }) {
  const { flag, title } = props;
  return flag ? (
    <Tooltip label={title}>
      <Image
        alt={title}
        boxSize="1em"
        src={`img/${flag}.gif`}
        display="inline-block"
      />
    </Tooltip>
  ) : (
    <>{title}</>
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

  const halfType =
    flags.half === 1 ? (
      <TypeSpan title="; first half of term" />
    ) : flags.half === 2 ? (
      <TypeSpan title="; second half of term" />
    ) : (
      ""
    );

  return (
    <Flex gap={4} align="center">
      <Flex align="center">
        {types1}
        <Flex ml={1} align="center">
          ({seasons}){types2}
          {halfType}
        </Flex>
      </Flex>
      <Text>
        {totalUnits} units: {units.join("-")}
      </Text>
      {flags.final ? <Text>Has final</Text> : null}
    </Flex>
  );
}

/** List of related classes, appears after flags and before description. */
function ClassRelated(props: { cls: Class; firehose: Firehose }) {
  const { cls, firehose } = props;
  const { prereq, same, meets } = cls.related;

  return (
    <>
      <Text>Prereq: {linkClasses(firehose, prereq)}</Text>
      {same !== "" && <Text>Same class as: {linkClasses(firehose, same)}</Text>}
      {meets !== "" && (
        <Text> Meets with: {linkClasses(firehose, meets)} </Text>
      )}
    </>
  );
}

/** Class evaluation info. */
function ClassEval(props: { cls: Class }) {
  const { cls } = props;
  const { rating, hours, people } = cls.evals;

  return (
    <Flex gap={4}>
      <Text>Rating: {rating}</Text>
      <Text>Hours: {hours}</Text>
      <Text>Avg # of students: {people}</Text>
    </Flex>
  );
}

/** Class description, person in-charge, and any URLs afterward. */
function ClassBody(props: { cls: Class; firehose: Firehose }) {
  const { cls, firehose } = props;
  const { description, inCharge, extraUrls } = cls.description;

  return (
    <Flex direction="column" gap={2}>
      <Text lang="en" style={{ hyphens: "auto" }}>
        {linkClasses(firehose, decode(description))}
      </Text>
      {inCharge !== "" && <Text>In-charge: {inCharge}.</Text>}
      {extraUrls.length > 0 && (
        <Flex gap={4}>
          {extraUrls.map<ReactNode>(({ label, url }) => (
            <Link key={label} href={url}>
              {label}
            </Link>
          ))}
        </Flex>
      )}
    </Flex>
  );
}

/** Full class description, from title to URLs at the end. */
function ClassDescription(props: { cls: Class; firehose: Firehose }) {
  const { cls, firehose } = props;

  return (
    <Flex direction="column" gap={4}>
      <Heading size="sm">
        {cls.number}: {cls.name}
      </Heading>
      <Flex direction="column" gap={0.5}>
        <ClassTypes cls={cls} />
        <ClassRelated cls={cls} firehose={firehose} />
        <ClassEval cls={cls} />
      </Flex>
      <ClassButtons cls={cls} firehose={firehose} />
      <ClassBody cls={cls} firehose={firehose} />
    </Flex>
  );
}

/** Full non-class activity description, from title to timeslots. */
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
        <p className="timeslot" key={t.toString()}>
          <button
            className="btn btn-secondary btn-sm"
            onClick={() => firehose.removeTimeslot(activity, t)}
          >
            Remove
          </button>{" "}
          {t.toString()}
        </p>
      ))}
    </>
  );
}

/** Activity description, whether class or non-class. */
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
