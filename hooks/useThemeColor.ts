import { Colors } from "@/constants/Colors";
import { getThemeColors } from "@/constants/AppThemes";
import { useSettingsStore } from "@/stores/settingsStore";

type ThemeColorName = keyof typeof Colors.light & keyof typeof Colors.dark;

export function useThemeColor(
  props: { light?: string; dark?: string },
  colorName: ThemeColorName
) {
  const themePreset = useSettingsStore((state) => state.themePreset);
  const themeMode = useSettingsStore((state) => state.themeMode);
  const palette = getThemeColors(themePreset, themeMode);
  const colorFromProps = props[themeMode];

  if (colorFromProps) {
    return colorFromProps;
  }

  return palette[colorName] ?? Colors[themeMode][colorName];
}
