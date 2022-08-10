import { Flex, Link, Text } from "@chakra-ui/react";
import { Firehose } from "./firehose";

/**
 * The footer on the bottom of the calendar.
 *
 * TODO: implement functionality
 * TODO: make years independent
 */
export function LeftFooter() {
  return (
    <Flex
      direction="column"
      align="center"
      gap={0.5}
      opacity={0.3}
      _hover={{ opacity: 1 }}
      transition="0.5s opacity"
    >
      {/* <span id="prereg-link">Preregister these classes!</span>
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
        </span> */}
      <Text>
        Beta by{" "}
        <Link href="mailto:cjq@mit.edu" color="inherit">
          CJ Quines
        </Link>
        . Firehose &copy;2022{" "}
        <Link href="mailto:edwardf@alum.mit.edu" color="inherit">
          Edward Fan
        </Link>
        .
      </Text>
      <Text>
        Subject descriptions and evaluations &copy;2022 Massachusetts Institute
        of Technology.
      </Text>
    </Flex>
  );
}

/** The footer on the bottom of the activity description. */
export function RightFooter(props: { firehose: Firehose }) {
  const { firehose } = props;
  return (
    <Flex
      direction="column"
      align="center"
      gap={0.5}
      opacity={0.3}
      _hover={{ opacity: 1 }}
      transition="0.5s opacity"
    >
      <Text>Last updated: {firehose.lastUpdated}.</Text>
      <Text>
        Questions? Issues? Feedback?{" "}
        <Link href="mailto:cjq@mit.edu">Send me an email!</Link>
      </Text>
      <Text>
        Looking for the old Firehose? It's been moved{" "}
        <Link href="https://firehose.guide/old_www/evaluations.html">here</Link>
        .
      </Text>
      <Flex gap={4}>
        <Link href="https://github.com/edfan/firehose">GitHub</Link>
        <Link href="privacy.html">Privacy Policy</Link>
      </Flex>
    </Flex>
  );
}
