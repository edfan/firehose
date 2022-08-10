import {
  Button,
  ButtonGroup,
  Checkbox,
  Flex,
  FormControl,
  FormLabel,
  Heading,
  Input,
  Radio,
  Select,
  Text,
} from "@chakra-ui/react";
import { useState } from "react";
import { HexColorPicker } from "react-colorful";

import { Activity, NonClass, Timeslot } from "./activity";
import { Class, Section, Sections } from "./class";
import { Firehose } from "./firehose";
import {
  WEEKDAY_STRINGS,
  TIMESLOT_STRINGS,
  dayStringToSlot,
} from "./utils";

import { ColorButton } from "./SelectedActivities";

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
    <Radio
      isChecked={checked}
      onChange={() => {
        firehose.lockSection(secs, sec);
      }}
    >
      {sec instanceof Section
        ? sec.rawTime
        : sec === "auto"
        ? "Auto (default)"
        : "None"}
    </Radio>
  );
}

/** Div containing section manual selection interface. */
function ClassManualSections(props: { cls: Class; firehose: Firehose }) {
  const { cls, firehose } = props;

  const renderOptions = () => {
    return cls.sections.map((secs) => {
      const options: Array<Section | "auto" | "none"> = [
        "auto",
        "none",
        ...secs.sections,
      ];
      return (
        <FormControl key={secs.kind}>
          <FormLabel>{secs.name}</FormLabel>
          <Flex direction="column">
            {options.map((sec, i) => (
              <ClassManualOption
                key={i}
                secs={secs}
                sec={sec}
                firehose={firehose}
              />
            ))}
          </Flex>
        </FormControl>
      );
    });
  };

  return <Flex>{renderOptions()}</Flex>;
}

/** Div containing color selection interface. */
function ActivityColor(props: {
  activity: Activity;
  firehose: Firehose;
  onHide: () => void;
}) {
  const { activity, firehose, onHide } = props;
  const initColor = activity.backgroundColor;
  const [color, setColor] = useState(initColor);

  const onReset = () => {
    firehose.setBackgroundColor(activity, undefined);
    onHide();
  };
  const onCancel = onHide;
  const onConfirm = () => {
    firehose.setBackgroundColor(activity, color);
    onHide();
  };

  return (
    <Flex gap={2}>
      <HexColorPicker color={color} onChange={setColor} />
      <Flex direction="column" gap={2}>
        <ColorButton color={color} style={{ cursor: "default" }}>
          {activity.buttonName}
        </ColorButton>
        <Button onClick={onReset}>Reset</Button>
        <Button onClick={onCancel}>Cancel</Button>
        <Button onClick={onConfirm}>Confirm</Button>
      </Flex>
    </Flex>
  );
}

/** Buttons in class description to add/remove class, and lock sections. */
export function ClassButtons(props: { cls: Class; firehose: Firehose }) {
  const { cls, firehose } = props;

  const [showManual, setShowManual] = useState(false);
  const [showColors, setShowColors] = useState(false);
  const isSelected = firehose.isSelectedActivity(cls);

  return (
    <Flex direction="column" gap={2}>
      <ButtonGroup>
        <Button onClick={() => firehose.toggleActivity(cls)}>
          {isSelected ? "Remove class" : "Add class"}
        </Button>
        {isSelected && (
          <Button
            onClick={() => setShowManual(!showManual)}
            variant={showManual ? "outline" : "solid"}
          >
            Edit sections
          </Button>
        )}
        {isSelected && (
          <Button
            onClick={() => setShowColors(!showColors)}
            variant={showColors ? "outline" : "solid"}
          >
            Edit color
          </Button>
        )}
      </ButtonGroup>
      {isSelected && showManual && (
        <ClassManualSections cls={cls} firehose={firehose} />
      )}
      {isSelected && showColors && (
        <ActivityColor
          activity={cls}
          firehose={firehose}
          onHide={() => setShowColors(false)}
        />
      )}
    </Flex>
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
    <Select
      value={times[key]}
      onChange={(e) => setTimes({ ...times, [key]: e.target.value })}
      size="sm"
    >
      {TIMESLOT_STRINGS.map((time) => (
        <option key={time} value={time}>
          {time}
        </option>
      ))}
    </Select>
  );

  return (
    <form
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
      <Flex align="center" gap={2}>
        <Button type="submit" size="sm">
          Add time
        </Button>
        {WEEKDAY_STRINGS.map((day) => (
          <Checkbox
            key={day}
            checked={days[day]}
            onChange={(e) => setDays({ ...days, [day]: e.target.checked })}
          >
            {day}
          </Checkbox>
        ))}
        <Flex align="center" gap={1}>
          {timeDrop("start")} to {timeDrop("end")}
        </Flex>
      </Flex>
    </form>
  );
}

/** Buttons in non-class description to rename it, or add/edit/remove timeslots. */
export function NonClassButtons(props: {
  activity: NonClass;
  firehose: Firehose;
}) {
  const { activity, firehose } = props;

  const isSelected = firehose.isSelectedActivity(activity);
  const [isRenaming, setIsRenaming] = useState(false);
  const [name, setName] = useState(activity.name);
  const [showColors, setShowColors] = useState(false);

  return (
    <Flex direction="column" gap={4}>
      {isRenaming ? (
        <Input
          value={name}
          onChange={(e) => setName(e.target.value)}
          fontWeight="bold"
          placeholder="New Activity"
        />
      ) : (
        <Heading size="sm">{activity.name}</Heading>
      )}
      <ButtonGroup>
        {isRenaming ? (
          <>
            <Button
              onClick={() => {
                firehose.renameNonClass(activity, name);
                setIsRenaming(false);
              }}
            >
              Confirm
            </Button>
            <Button
              onClick={() => {
                setName(activity.name);
                setIsRenaming(false);
              }}
            >
              Cancel
            </Button>
          </>
        ) : (
          <>
            <Button onClick={() => firehose.toggleActivity(activity)}>
              {isSelected ? "Remove activity" : "Add activity"}
            </Button>
            <Button onClick={() => setIsRenaming(true)}>Rename activity</Button>
            {isSelected && (
              <Button
                onClick={() => setShowColors(!showColors)}
                variant={showColors ? "outline" : "solid"}
              >
                Edit color
              </Button>
            )}
          </>
        )}
      </ButtonGroup>
      {isSelected && showColors && (
        <ActivityColor
          activity={activity}
          firehose={firehose}
          onHide={() => setShowColors(false)}
        />
      )}
      <Text>
        Click and drag on an empty time in the calendar to add the times for
        your activity. Or add one manually:
      </Text>
      <NonClassAddTime activity={activity} firehose={firehose} />
    </Flex>
  );
}
