import { Flex, Link, Radio, Text, useColorMode } from "@chakra-ui/react";
import { Firehose } from "./firehose";
import { ColorScheme, TColorScheme } from "./utils";

/**
 * The footer on the bottom of the calendar.
 *
 * TODO: add gcal export
 * TODO: add text form?
 */
export function LeftFooter(props: {
  colorScheme: TColorScheme;
  firehose: Firehose;
}) {
  const { colorScheme, firehose } = props;
  const year = new Date().getFullYear();

  const { colorMode, toggleColorMode } = useColorMode();
  const onSetColorScheme = (scheme: string) => {
    const isColorScheme = (s: string): s is TColorScheme =>
      (Object.values(ColorScheme) as Array<string>).includes(s);
    if (!isColorScheme(scheme)) return;
    if (
      (colorMode === "light" && scheme === ColorScheme.Dark) ||
      (colorMode === "dark" && scheme !== ColorScheme.Dark)
    ) {
      toggleColorMode();
    }
    firehose.setColorScheme(scheme);
  };

  return (
    <Flex
      direction="column"
      align="center"
      gap={0.5}
      opacity={0.3}
      _hover={{ opacity: 1 }}
      transition="0.5s opacity"
    >
      <Flex gap={4}>
        Color scheme:
        {Object.values(ColorScheme).map((scheme) => (
          <Radio
            key={scheme}
            isChecked={scheme === colorScheme}
            onChange={() => onSetColorScheme(scheme)}
          >
            {scheme}
          </Radio>
        ))}
      </Flex>
      <Text>
        Beta by{" "}
        <Link href="mailto:cjq@mit.edu" color="inherit">
          CJ Quines
        </Link>
        . Firehose &copy;{year}{" "}
        <Link href="mailto:edwardf@alum.mit.edu" color="inherit">
          Edward Fan
        </Link>
        .
      </Text>
      <Text>
        Subject descriptions and evaluations &copy;{year} Massachusetts
        Institute of Technology.
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
