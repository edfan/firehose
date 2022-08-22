import { useEffect, useRef, useState } from "react";
import { GoogleOAuthProvider } from "@react-oauth/google";
import {
  Box,
  ChakraProvider,
  Flex,
  Link,
  Spinner,
  extendTheme,
  useColorMode,
} from "@chakra-ui/react";

import { colorSchemePresets } from "../lib/colors";
import { Term, TermInfo } from "../lib/dates";
import { Firehose, FirehoseState } from "../lib/firehose";
import { RawClass } from "../lib/rawClass";

import { ActivityDescription } from "./ActivityDescription";
import { Calendar } from "./Calendar";
import { ClassTable } from "./ClassTable";
import { LeftFooter, RightFooter } from "./Footers";
import { Header } from "./Header";
import { ScheduleOption } from "./ScheduleOption";
import { ScheduleSwitcher } from "./ScheduleSwitcher";
import { SelectedActivities } from "./SelectedActivities";

import "@fontsource/inter/variable.css";
import "./App.scss";

type SemesterData = {
  classes: { [cls: string]: RawClass };
  lastUpdated: string;
  termInfo: TermInfo;
};

/** The main application. */
export function App() {
  const firehoseRef = useRef<Firehose>();
  const firehose = firehoseRef.current;

  const [loading, setLoading] = useState(true);
  const [state, setState] = useState<FirehoseState>({
    selectedActivities: [],
    viewedActivity: undefined,
    selectedOption: 0,
    totalOptions: 0,
    units: 0,
    hours: 0,
    warnings: [],
    saveId: "",
    saves: [],
    colorScheme: colorSchemePresets[0],
  });

  useEffect(() => {
    Promise.all([
      // TODO update url name: path might be wrong
      fetch("latestTerm.json", { cache: "no-cache" }).then(
        (res) => res.json() as Promise<TermInfo>
      ),
      fetch("full.json", { cache: "no-cache" }).then(
        (res) => res.json() as Promise<SemesterData>
      ),
    ]).then(([latestTerm, { classes, lastUpdated, termInfo }]) => {
      const classesMap = new Map(Object.entries(classes));
      const firehoseObj = new Firehose(
        classesMap,
        new Term(termInfo),
        lastUpdated,
        new Term(latestTerm)
      );
      firehoseRef.current = firehoseObj;
      setLoading(false);
      // @ts-ignore
      window.firehose = firehoseObj;
    });
  }, []);

  const { colorMode, toggleColorMode } = useColorMode();
  useEffect(() => {
    if (loading || !firehose) return;
    firehose.callback = (newState: FirehoseState) => {
      setState(newState);
      if (colorMode !== newState.colorScheme.colorMode) {
        toggleColorMode?.();
      }
    };
    firehose?.updateState();
  }, [colorMode, firehose, loading, toggleColorMode]);

  const theme = extendTheme({
    components: {
      Link: {
        baseStyle: ({ colorMode }: { colorMode: string }) => ({
          color: colorMode === "light" ? "blue.500" : "blue.200",
        }),
      },
    },
    config: {
      initialColorMode: "light",
    },
    fonts: {
      body: `'InterVariable', sans-serif`,
      heading: `'InterVariable', sans-serif`,
    },
  });

  return (
    <ChakraProvider theme={theme}>
      <GoogleOAuthProvider clientId={process.env.REACT_APP_GOOGLE_CLIENT_ID!}>
        <Box
          w="100%"
          p={4}
          fontSize="sm"
          textAlign="center"
          borderBottom="1px"
          borderBottomColor="gray.400"
        >
          This version is in beta. Saved info may disappear without warning.{" "}
          <Link href="https://forms.gle/Fh1N3Uy1Kcjf5hnQ9">
            Share your feedback!
          </Link>
        </Box>
        {!firehose ? (
          <Flex w="100%" h="100vh" align="center" justify="center">
            <Spinner />
          </Flex>
        ) : (
          <Flex
            w="100%"
            direction={{ base: "column", lg: "row" }}
            p={4}
            gap={8}
          >
            <Flex direction="column" w={{ base: "100%", lg: "50%" }} gap={6}>
              <Header firehose={firehose} />
              <ScheduleOption
                selectedOption={state.selectedOption}
                totalOptions={state.totalOptions}
                firehose={firehose}
              />
              <Calendar
                selectedActivities={state.selectedActivities}
                viewedActivity={state.viewedActivity}
                firehose={firehose}
              />
              <LeftFooter colorScheme={state.colorScheme} firehose={firehose} />
            </Flex>
            <Flex direction="column" w={{ base: "100%", lg: "50%" }} gap={6}>
              <ScheduleSwitcher
                firehose={firehose}
                saveId={state.saveId}
                saves={state.saves}
              />
              <SelectedActivities
                selectedActivities={state.selectedActivities}
                units={state.units}
                hours={state.hours}
                warnings={state.warnings}
                firehose={firehose}
              />
              <ClassTable
                classes={firehose.classes} // this is a constant; no need to add to state
                firehose={firehose}
              />
              {state.viewedActivity ? (
                <ActivityDescription
                  activity={state.viewedActivity}
                  firehose={firehose}
                />
              ) : null}
              <RightFooter firehose={firehose} />
            </Flex>
          </Flex>
        )}
      </GoogleOAuthProvider>
    </ChakraProvider>
  );
}
