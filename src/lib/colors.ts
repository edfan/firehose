import { Activity } from "./activity";

/** The type of color schemes. */
export type ColorScheme = {
  name: string;
  colorMode: "light" | "dark";
  backgroundColors: Array<string>;
};

const classic: ColorScheme = {
  name: "Classic",
  colorMode: "light",
  backgroundColors: [
    "#23AF83",
    "#3E9ED1",
    "#AE7CB4",
    "#DE676F",
    "#E4793C",
    "#D7AD00",
    "#33AE60",
    "#F08E94",
    "#8FBDD9",
    "#A2ACB0",
  ],
};

const classicDark: ColorScheme = {
  name: "Classic (Dark)",
  colorMode: "dark",
  backgroundColors: [
    "#36C0A5",
    "#5EBEF1",
    "#CE9CD4",
    "#EA636B",
    "#FF995C",
    "#F7CD20",
    "#47CE80",
    "#FFAEB4",
    "#AFDDF9",
    "#C2CCD0",
  ],
};

const highContrast: ColorScheme = {
  name: "High Contrast",
  colorMode: "light",
  backgroundColors: [
    "#D32F2F",
    "#2E7D32",
    "#1565C0",
    "#BF360C",
    "#00838f",
    "#AD1457",
    "#827717",
    "#795548",
  ],
};

const highContrastDark: ColorScheme = {
  name: "High Contrast (Dark)",
  colorMode: "dark",
  backgroundColors: [
    "#36C0A5",
    "#5EBEF1",
    "#CE9CD4",
    "#EA636B",
    "#FF995C",
    "#F7CD20",
    "#47CE80",
    "#FFAEB4",
    "#AFDDF9",
    "#C2CCD0",
  ],
};

/** The default color schemes. */
export const COLOR_SCHEME_PRESETS: Array<ColorScheme> = [
  classic,
  classicDark,
  highContrast,
  highContrastDark,
];

/** The default background color for a color scheme. */
export function fallbackColor(colorScheme: ColorScheme): string {
  return colorScheme.colorMode === "light" ? "#4A5568" : "#CBD5E0";
}

/** MurmurHash3, seeded with a string. */
function murmur3(str: string): () => number {
  let hash = 1779033703 ^ str.length;
  for (let i = 0; i < str.length; i++) {
    hash = Math.imul(hash ^ str.charCodeAt(i), 3432918353);
    hash = (hash << 13) | (hash >>> 19);
  }
  return () => {
    hash = Math.imul(hash ^ (hash >>> 16), 2246822507);
    hash = Math.imul(hash ^ (hash >>> 13), 3266489909);
    return (hash ^= hash >>> 16) >>> 0;
  };
}

/**
 * Assign background colors to a list of activities. Mutates each activity
 * in the list.
 */
export function chooseColors(
  activities: Array<Activity>,
  colorScheme: ColorScheme
): void {
  // above this length, we give up trying to be nice:
  const colorLen = colorScheme.backgroundColors.length;
  const indices: Array<number> = [];
  for (const activity of activities) {
    if (activity.manualColor) continue;
    const hash = murmur3(activity.id);
    let index = hash() % colorLen;
    // try to pick distinct colors if possible; hash to try to make each
    // activity have a consistent color.
    while (indices.length < colorLen && indices.indexOf(index) !== -1) {
      index = hash() % colorLen;
    }
    indices.push(index);
    activity.backgroundColor = colorScheme.backgroundColors[index];
  }
}

/** Choose a text color for a background given by hex code color. */
export function textColor(color: string): string {
  const r = parseInt(color.substring(1, 3), 16);
  const g = parseInt(color.substring(3, 5), 16);
  const b = parseInt(color.substring(5, 7), 16);
  const brightness = (r * 299 + g * 587 + b * 114) / 1000;
  return brightness > 128 ? "#000000" : "#ffffff";
}

/** The Google calendar background color. */
export const CALENDAR_COLOR = "#DB5E45";
