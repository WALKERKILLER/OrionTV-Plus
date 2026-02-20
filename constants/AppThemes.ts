export type ThemeMode = "light" | "dark";

export type ThemePresetKey = "cedar" | "moss" | "shore";

export interface ThemePresetMeta {
  key: ThemePresetKey;
  label: string;
  description: string;
}

export interface AppThemeColors {
  text: string;
  background: string;
  surface: string;
  surfaceVariant: string;
  overlay: string;
  tint: string;
  icon: string;
  tabIconDefault: string;
  tabIconSelected: string;
  link: string;
  border: string;
  outline: string;
  outlineVariant: string;
  primary: string;
  onPrimary: string;
  secondary: string;
  onSecondary: string;
  tertiary: string;
  onTertiary: string;
  focusRing: string;
  success: string;
  warning: string;
  error: string;
}

const buildPreset = (light: AppThemeColors, dark: AppThemeColors) => ({ light, dark });

const presets = {
  cedar: buildPreset(
    {
      text: "#1B1F1A",
      background: "#F4F7F3",
      surface: "#FFFFFF",
      surfaceVariant: "#E8EFE7",
      overlay: "rgba(27, 31, 26, 0.55)",
      tint: "#386A44",
      icon: "#59635A",
      tabIconDefault: "#6E786F",
      tabIconSelected: "#386A44",
      link: "#386A44",
      border: "#D8E2D7",
      outline: "#7A857B",
      outlineVariant: "#C0CBC0",
      primary: "#3A7050",
      onPrimary: "#F8FFFA",
      secondary: "#516352",
      onSecondary: "#F5FFF2",
      tertiary: "#5F5A73",
      onTertiary: "#F9F6FF",
      focusRing: "#79AD88",
      success: "#3A7050",
      warning: "#8A5F00",
      error: "#B2384A",
    },
    {
      text: "#E2E7DF",
      background: "#0F1411",
      surface: "#18201A",
      surfaceVariant: "#222B23",
      overlay: "rgba(8, 11, 9, 0.8)",
      tint: "#94D7A6",
      icon: "#B7C8B5",
      tabIconDefault: "#95A694",
      tabIconSelected: "#94D7A6",
      link: "#94D7A6",
      border: "#2F3A31",
      outline: "#8A9B88",
      outlineVariant: "#39463A",
      primary: "#94D7A6",
      onPrimary: "#0E1B12",
      secondary: "#B7CCB6",
      onSecondary: "#1A271B",
      tertiary: "#C7C0E0",
      onTertiary: "#251F37",
      focusRing: "#CAEFD1",
      success: "#7FD096",
      warning: "#E2BE72",
      error: "#FFB2BA",
    }
  ),
  moss: buildPreset(
    {
      text: "#1F1D16",
      background: "#F8F6EF",
      surface: "#FFFCF5",
      surfaceVariant: "#EFE8DB",
      overlay: "rgba(28, 24, 18, 0.55)",
      tint: "#6E5F2D",
      icon: "#67604D",
      tabIconDefault: "#7A715E",
      tabIconSelected: "#6E5F2D",
      link: "#6E5F2D",
      border: "#DED4C2",
      outline: "#817661",
      outlineVariant: "#CABEA8",
      primary: "#6E5F2D",
      onPrimary: "#FFFFFF",
      secondary: "#645D47",
      onSecondary: "#FEF9EE",
      tertiary: "#49635A",
      onTertiary: "#F1FFF9",
      focusRing: "#B6A568",
      success: "#4E7A66",
      warning: "#9D6200",
      error: "#A83F3F",
    },
    {
      text: "#E8E1D4",
      background: "#17140F",
      surface: "#201C15",
      surfaceVariant: "#2A241A",
      overlay: "rgba(9, 8, 6, 0.8)",
      tint: "#DCC57A",
      icon: "#C6BDA8",
      tabIconDefault: "#9D937F",
      tabIconSelected: "#DCC57A",
      link: "#DCC57A",
      border: "#3A3326",
      outline: "#9D917A",
      outlineVariant: "#443D30",
      primary: "#DCC57A",
      onPrimary: "#362C00",
      secondary: "#D0C4A7",
      onSecondary: "#312C1D",
      tertiary: "#A8D1C3",
      onTertiary: "#12372F",
      focusRing: "#F3E5B7",
      success: "#9BD6B9",
      warning: "#F3C876",
      error: "#FFB5A7",
    }
  ),
  shore: buildPreset(
    {
      text: "#192023",
      background: "#F0F5F7",
      surface: "#FCFDFE",
      surfaceVariant: "#DEE9EE",
      overlay: "rgba(17, 24, 27, 0.58)",
      tint: "#3E6680",
      icon: "#54636B",
      tabIconDefault: "#64747D",
      tabIconSelected: "#3E6680",
      link: "#3E6680",
      border: "#C9D8E0",
      outline: "#6F818D",
      outlineVariant: "#B5C8D2",
      primary: "#406A85",
      onPrimary: "#F8FCFF",
      secondary: "#536572",
      onSecondary: "#EEF6FD",
      tertiary: "#5B5C7D",
      onTertiary: "#F8F7FF",
      focusRing: "#8BB7D4",
      success: "#3D7A66",
      warning: "#8D6400",
      error: "#B24555",
    },
    {
      text: "#DEE5EA",
      background: "#0E1418",
      surface: "#162027",
      surfaceVariant: "#202A32",
      overlay: "rgba(6, 9, 11, 0.82)",
      tint: "#A3CAE2",
      icon: "#B5C7D2",
      tabIconDefault: "#8FA3AF",
      tabIconSelected: "#A3CAE2",
      link: "#A3CAE2",
      border: "#2B3841",
      outline: "#90A7B4",
      outlineVariant: "#34424C",
      primary: "#A3CAE2",
      onPrimary: "#072033",
      secondary: "#C0D2DE",
      onSecondary: "#1D2D38",
      tertiary: "#C8C5EC",
      onTertiary: "#25244A",
      focusRing: "#D5E9F6",
      success: "#99D9C0",
      warning: "#EAC17E",
      error: "#FFB3BB",
    }
  ),
} as const;

export const THEME_PRESETS: ThemePresetMeta[] = [
  {
    key: "cedar",
    label: "雪松林境",
    description: "森林雪松与宁静岩石",
  },
  {
    key: "moss",
    label: "苔原雾野",
    description: "苔藓土壤与温润木纹",
  },
  {
    key: "shore",
    label: "海岸晨雾",
    description: "海风薄雾与柔和冷灰",
  },
];

export const DEFAULT_THEME_PRESET: ThemePresetKey = "cedar";
export const DEFAULT_THEME_MODE: ThemeMode = "dark";

export const getThemeColors = (
  preset: ThemePresetKey = DEFAULT_THEME_PRESET,
  mode: ThemeMode = DEFAULT_THEME_MODE
): AppThemeColors => {
  const palette = presets[preset] ?? presets[DEFAULT_THEME_PRESET];
  return palette[mode] ?? palette[DEFAULT_THEME_MODE];
};

export const isThemePresetKey = (value: string): value is ThemePresetKey =>
  THEME_PRESETS.some((preset) => preset.key === value);

export const isThemeMode = (value: string): value is ThemeMode => value === "light" || value === "dark";

