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
import { ComponentProps, FormEvent, useEffect, useState } from "react";
import { HexColorPicker } from "react-colorful";

import { Activity, NonClass, Timeslot } from "../lib/activity";
import { Class, LockOption, SectionLockOption, Sections } from "../lib/class";
import { WEEKDAY_STRINGS, TIMESLOT_STRINGS, Slot } from "../lib/dates";
import { Firehose } from "../lib/firehose";

import { ColorButton } from "./SelectedActivities";

/**
 * A button that toggles the active value, and is outlined if active, solid
 * if not.
 */
function ToggleButton(
  props: ComponentProps<"button"> & {
    active: boolean;
    setActive: (value: boolean) => void;
  }
) {
  const { children, active, setActive, ...otherProps } = props;
  return (
    <Button
      {...otherProps}
      onClick={() => setActive(!active)}
      variant={active ? "outline" : "solid"}
    >
      {children}
    </Button>
  );
}

/** A single, manual section option, under {@link ClassManualSections}. */
function ClassManualOption(props: {
  secs: Sections;
  sec: SectionLockOption;
  firehose: Firehose;
}) {
  const { secs, sec, firehose } = props;
  const [isChecked, label] = (() => {
    if (sec === LockOption.Auto) {
      return [!secs.locked, "Auto (default)"];
    } else if (sec === LockOption.None) {
      return [secs.selected === null, "None"];
    } else {
      return [secs.locked && secs.selected === sec, sec.rawTime];
    }
  })();

  return (
    <Radio
      isChecked={isChecked}
      onChange={() => firehose.lockSection(secs, sec)}
    >
      {label}
    </Radio>
  );
}

/** Div containing section manual selection interface. */
function ClassManualSections(props: { cls: Class; firehose: Firehose }) {
  const { cls, firehose } = props;

  const renderOptions = () => {
    return cls.sections.map((secs) => {
      const options = [LockOption.Auto, LockOption.None, ...secs.sections];
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
          <ToggleButton active={showManual} setActive={setShowManual}>
            Edit sections
          </ToggleButton>
        )}
        {isSelected && (
          <ToggleButton active={showColors} setActive={setShowColors}>
            Edit color
          </ToggleButton>
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

  const onSubmit = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    for (const day in days) {
      if (!days[day]) continue;
      firehose.addTimeslot(
        activity,
        Timeslot.fromStartEnd(
          Slot.fromDayString(day, times.start),
          Slot.fromDayString(day, times.end)
        )
      );
    }
  };

  const renderCheckboxes = () => {
    return WEEKDAY_STRINGS.map((day) => (
      <Checkbox
        key={day}
        checked={days[day]}
        onChange={(e) => setDays({ ...days, [day]: e.target.checked })}
      >
        {day}
      </Checkbox>
    ));
  };

  const renderTimeDropdown = (key: "start" | "end") => (
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
    <form onSubmit={onSubmit}>
      <Flex align="center" gap={2}>
        <Button type="submit" size="sm">
          Add time
        </Button>
        {renderCheckboxes()}
        <Flex align="center" gap={1}>
          {renderTimeDropdown("start")} to {renderTimeDropdown("end")}
        </Flex>
      </Flex>
    </form>
  );
}

/**
 * Buttons in non-class description to rename it, or add/edit/remove timeslots.
 */
export function NonClassButtons(props: {
  activity: NonClass;
  firehose: Firehose;
}) {
  const { activity, firehose } = props;

  const isSelected = firehose.isSelectedActivity(activity);
  const [isRenaming, setIsRenaming] = useState(false);
  const [name, setName] = useState(activity.name);
  const [showColors, setShowColors] = useState(false);

  const [renderHeading, renderButtons] = (() => {
    if (isRenaming) {
      const renderHeading = () => (
        <Input
          value={name}
          onChange={(e) => setName(e.target.value)}
          fontWeight="bold"
          placeholder="New Activity"
        />
      );
      const onConfirm = () => {
        firehose.renameNonClass(activity, name);
        setIsRenaming(false);
      };
      const onCancel = () => {
        setIsRenaming(false);
      };
      const renderButtons = () => (
        <>
          <Button onClick={onConfirm}>Confirm</Button>
          <Button onClick={onCancel}>Cancel</Button>
        </>
      );
      return [renderHeading, renderButtons];
    }

    const renderHeading = () => <Heading size="sm">{activity.name}</Heading>;
    const onRename = () => {
      setName(activity.name);
      setIsRenaming(true);
    };
    const renderButtons = () => (
      <>
        <Button onClick={() => firehose.toggleActivity(activity)}>
          {isSelected ? "Remove activity" : "Add activity"}
        </Button>
        <Button onClick={onRename}>Rename activity</Button>
        {isSelected && (
          <ToggleButton active={showColors} setActive={setShowColors}>
            Edit color
          </ToggleButton>
        )}
      </>
    );

    return [renderHeading, renderButtons];
  })();

  return (
    <Flex direction="column" gap={4}>
      {renderHeading()}
      <ButtonGroup>{renderButtons()}</ButtonGroup>
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
