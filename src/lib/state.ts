import { Activity } from "./activity";
import { ColorScheme, COLOR_SCHEME_PRESETS } from "./colors";

/** A save has an ID and a name. */
export type Save = {
  id: string;
  name: string;
};

/** Browser-specific user preferences. */
export type Preferences = {
  colorScheme: ColorScheme;
  roundedCorners: boolean;
  showEventTimes: boolean;
};

/** The default user preferences. */
export const DEFAULT_PREFERENCES: Preferences = {
  colorScheme: COLOR_SCHEME_PRESETS[0],
  roundedCorners: false,
  showEventTimes: false,
};

/** React state. */
export type FirehoseState = {
  selectedActivities: Array<Activity>;
  viewedActivity: Activity | undefined;
  selectedOption: number;
  totalOptions: number;
  units: number;
  hours: number;
  warnings: Array<string>;
  saveId: string;
  saves: Array<Save>;
  preferences: Preferences;
};

/** Default React state. */
export const DEFAULT_STATE: FirehoseState = {
  selectedActivities: [],
  viewedActivity: undefined,
  selectedOption: 0,
  totalOptions: 0,
  units: 0,
  hours: 0,
  warnings: [],
  saveId: "",
  saves: [],
  preferences: DEFAULT_PREFERENCES,
};
