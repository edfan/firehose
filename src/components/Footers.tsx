import {
  Button,
  Flex,
  Image,
  Link,
  Modal,
  ModalBody,
  ModalContent,
  ModalFooter,
  ModalHeader,
  ModalOverlay,
  Select,
  Spinner,
  Text,
  Tooltip,
} from "@chakra-ui/react";
import { useRef, useState } from "react";

import { COLOR_SCHEME_PRESETS } from "../lib/colors";
import { Firehose } from "../lib/firehose";
import { useCalendarExport } from "../lib/gapi";
import { DEFAULT_PREFERENCES, Preferences } from "../lib/state";

function PreferencesModal(props: {
  firehose: Firehose;
  preferences: Preferences;
}) {
  const { preferences: originalPreferences, firehose } = props;
  const [visible, setVisible] = useState(false);
  const [preferences, setPreferences] = useState(DEFAULT_PREFERENCES);
  const initialPreferencesRef = useRef(DEFAULT_PREFERENCES);
  const initialPreferences = initialPreferencesRef.current;

  const onOpen = () => {
    initialPreferencesRef.current = originalPreferences;
    setPreferences(originalPreferences);
    setVisible(true);
  };

  const previewPreferences = (newPreferences: Preferences) => {
    setPreferences(newPreferences);
    firehose.setPreferences(newPreferences, false);
  };

  const onCancel = () => {
    setPreferences(initialPreferences);
    firehose.setPreferences(initialPreferences);
    setVisible(false);
  };

  const onConfirm = () => {
    firehose.setPreferences(preferences);
    setVisible(false);
  };

  return (
    <>
      <Button onClick={onOpen}>Preferences</Button>
      <Modal isOpen={visible} onClose={onCancel}>
        <ModalOverlay />
        <ModalContent>
          <ModalHeader>Preferences</ModalHeader>
          <ModalBody>
            <Flex gap={4}>
              Color scheme:
              <Select
                value={preferences.colorScheme.name}
                onChange={(e) => {
                  const colorScheme = COLOR_SCHEME_PRESETS.find(
                    ({ name }) => name === e.target.value
                  );
                  if (!colorScheme) return;
                  previewPreferences({ ...preferences, colorScheme });
                }}
              >
                {COLOR_SCHEME_PRESETS.map(({ name }) => (
                  <option key={name} value={name}>
                    {name}
                  </option>
                ))}
              </Select>
            </Flex>
          </ModalBody>
          <ModalFooter>
            <Button onClick={onCancel} mr={2}>
              Cancel
            </Button>
            <Button onClick={onConfirm}>Save</Button>
          </ModalFooter>
        </ModalContent>
      </Modal>
    </>
  );
}

/** The footer on the bottom of the calendar. */
export function LeftFooter(props: {
  preferences: Preferences;
  firehose: Firehose;
}) {
  const { preferences, firehose } = props;
  const year = new Date().getFullYear();

  const [isExporting, setIsExporting] = useState(false);
  const onCalendarExport = useCalendarExport(
    firehose,
    () => setIsExporting(false),
    () => setIsExporting(false)
  );

  return (
    <Flex
      direction="column"
      align="center"
      gap={0.5}
      opacity={0.3}
      _hover={{ opacity: 1 }}
      transition="0.5s opacity"
    >
      <Flex gap={2} align="center">
        <PreferencesModal preferences={preferences} firehose={firehose} />
        <Tooltip
          label={isExporting ? "Loading..." : "Make sure popups are enabled!"}
        >
          {isExporting ? (
            <Spinner m={3} />
          ) : (
            <Image
              src="img/calendar-button.svg"
              alt="Export to Google Calendar"
              onClick={() => {
                setIsExporting(true);
                onCalendarExport();
              }}
              style={{ cursor: "pointer" }}
            />
          )}
        </Tooltip>
      </Flex>
      <Text mt={2} fontSize="sm">
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
      <Text fontSize="sm">
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
