import { AddIcon } from "@chakra-ui/icons";
import { Button, Flex, Text } from "@chakra-ui/react";
import { ComponentProps } from "react";

import { Class } from "./class";
import { Activity } from "./activity";
import { Firehose } from "./firehose";
import { formatNumber, textColor } from "./utils";

export function ColorButton(
  props: ComponentProps<"button"> & { color: string }
) {
  const { children, color, style, ...otherProps } = props;
  return (
    <Button
      {...otherProps}
      style={{
        ...style,
        backgroundColor: color,
        borderColor: color,
        color: textColor(color),
      }}
    >
      {children}
    </Button>
  );
}

/** A button representing a single, selected activity. */
function ActivityButton(props: { activity: Activity; firehose: Firehose }) {
  const { activity, firehose } = props;
  const color = activity.backgroundColor;
  return (
    <ColorButton
      color={color}
      onClick={() => firehose.setViewedActivity(activity)}
      onDoubleClick={() => firehose.removeActivity(activity)}
    >
      {activity.buttonName}
    </ColorButton>
  );
}

/**
 * List of selected activities; one button for each activity.
 *
 * TODO: make buttons draggable
 */
export function SelectedActivities(props: {
  selectedActivities: Array<Activity>;
  units: number;
  hours: number;
  warnings: Array<string>;
  firehose: Firehose;
}) {
  const { selectedActivities, units, hours, warnings, firehose } = props;

  return (
    <Flex direction="column" gap={2}>
      <Flex gap={8} justify="center">
        <Text>{units} units</Text>
        <Text>{formatNumber(hours, 1)} hours</Text>
      </Flex>
      <Flex align="center" wrap="wrap">
        {selectedActivities.map((activity) => (
          <ActivityButton
            key={activity instanceof Class ? activity.number : activity.id}
            activity={activity}
            firehose={firehose}
          />
        ))}
        <Button
          leftIcon={<AddIcon />}
          onClick={() => firehose.addActivity()}
          size="sm"
        >
          Activity
        </Button>
      </Flex>
      {warnings.map((warning) => (
        <Flex key={warning} justify="center">
          <Text fontSize="sm">{warning}</Text>
        </Flex>
      ))}
    </Flex>
  );
}
