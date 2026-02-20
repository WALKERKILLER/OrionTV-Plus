import {
  DEFAULT_THEME_PRESET,
  getThemeColors,
} from "@/constants/AppThemes";

const lightTheme = getThemeColors(DEFAULT_THEME_PRESET, "light");
const darkTheme = getThemeColors(DEFAULT_THEME_PRESET, "dark");

export const Colors = {
  light: lightTheme,
  dark: darkTheme,
};
