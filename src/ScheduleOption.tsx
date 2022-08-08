import { Button, CloseButton, Flex, Text } from "@chakra-ui/react";
import { useState } from "react";

import { Firehose } from "./firehose";

export function ScheduleOption(props: {
  selectedOption: number;
  totalOptions: number;
  firehose: Firehose;
}) {
  const { selectedOption, totalOptions, firehose } = props;
  const [tooManyOptions, setTooManyOptions] = useState(true);

  return (
    <Flex direction="column" align="end" gap={2} mt={-10}>
      <Flex gap={2}>
        <Button
          onClick={() => firehose.selectOption(selectedOption - 1)}
          size="xs"
        >
          &larr;
        </Button>{" "}
        {selectedOption + 1} of {totalOptions}
        <Button
          onClick={() => firehose.selectOption(selectedOption + 1)}
          size="xs"
        >
          &rarr;
        </Button>
      </Flex>
      {tooManyOptions && totalOptions > 15 && (
        <Flex
          align="center"
          bg="gray.50"
          gap={1}
          px={2}
          py={1}
        >
          <Text fontSize="sm">
            Too many options? Use the "Edit sections" button above the class
            description.
          </Text>
          <CloseButton size="sm" onClick={() => setTooManyOptions(false)} />
        </Flex>
      )}
    </Flex>
  );
}
