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

import { Term, TermInfo } from "../lib/dates";
import { Firehose } from "../lib/firehose";
import { RawClass } from "../lib/rawClass";
import { DEFAULT_STATE, FirehoseState } from "../lib/state";

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

/** Hook to fetch data and initialize Firehose object. */
function useFirehose(): {
  firehose?: Firehose;
  state: FirehoseState;
} {
  const [loading, setLoading] = useState(true);
  const firehoseRef = useRef<Firehose>();
  const firehose = firehoseRef.current;

  const [state, setState] = useState<FirehoseState>(DEFAULT_STATE);

  /** Fetch from the url, which is JSON of type T. */
  const fetchNoCache = async <T,>(url: string): Promise<T> => {
    const res = await fetch(url, { cache: "no-cache" });
    return res.json() as Promise<T>;
  };

  useEffect(() => {
    // TODO update fetch url name: path might be wrong
    Promise.all([
      fetchNoCache<TermInfo>("latestTerm.json"),
      fetchNoCache<SemesterData>("full.json"),
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
    // if colorScheme changes, change colorMode to match
    firehose.callback = (newState: FirehoseState) => {
      setState(newState);
      if (colorMode !== newState.preferences.colorScheme.colorMode) {
        toggleColorMode?.();
      }
    };
    firehose?.updateState();
  }, [colorMode, firehose, loading, toggleColorMode]);

  return { firehose, state };
}

/** The application entry. */
function FirehoseApp() {
  const { firehose, state } = useFirehose();

  return (
    <>
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
        <Flex w="100%" direction={{ base: "column", lg: "row" }} p={4} gap={8}>
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
            <LeftFooter
              preferences={state.preferences}
              firehose={firehose}
            />
          </Flex>
          <Flex direction="column" w={{ base: "100%", lg: "50%" }} gap={6}>
            <ScheduleSwitcher
              saveId={state.saveId}
              saves={state.saves}
              firehose={firehose}
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
    </>
  );
}

/** The main application. */
export function App() {
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
        <FirehoseApp />
      </GoogleOAuthProvider>
    </ChakraProvider>
  );
}
