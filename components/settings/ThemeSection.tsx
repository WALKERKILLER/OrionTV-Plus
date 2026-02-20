import React, { useMemo } from "react";
import { StyleSheet, View } from "react-native";
import { Moon, Palette, Sun } from "lucide-react-native";
import { ThemedText } from "@/components/ThemedText";
import { StyledButton } from "@/components/StyledButton";
import { SettingsSection } from "@/components/settings/SettingsSection";
import { getThemeColors, THEME_PRESETS, ThemeMode, ThemePresetKey } from "@/constants/AppThemes";
import { useThemeColor } from "@/hooks/useThemeColor";

interface ThemeSectionProps {
  themePreset: ThemePresetKey;
  themeMode: ThemeMode;
  onThemePresetChange: (preset: ThemePresetKey) => void;
  onThemeModeChange: (mode: ThemeMode) => void;
  onChanged: () => void;
}

export const ThemeSection: React.FC<ThemeSectionProps> = ({
  themePreset,
  themeMode,
  onThemePresetChange,
  onThemeModeChange,
  onChanged,
}) => {
  const textColor = useThemeColor({}, "text");
  const onPrimaryColor = useThemeColor({}, "onPrimary");
  const outlineColor = useThemeColor({}, "outlineVariant");

  const styles = useMemo(
    () =>
      StyleSheet.create({
        titleRow: {
          flexDirection: "row",
          alignItems: "center",
          marginBottom: 12,
          gap: 10,
        },
        title: {
          fontSize: 18,
          lineHeight: 24,
          fontWeight: "700",
        },
        description: {
          fontSize: 13,
          lineHeight: 18,
          opacity: 0.76,
          marginBottom: 16,
        },
        modeRow: {
          flexDirection: "row",
          alignItems: "center",
          gap: 12,
          marginBottom: 18,
        },
        modeButton: {
          minWidth: 144,
        },
        presetWrap: {
          flexDirection: "row",
          flexWrap: "wrap",
          gap: 10,
        },
        presetButton: {
          minWidth: 170,
          alignItems: "flex-start",
          justifyContent: "flex-start",
          paddingVertical: 12,
          paddingHorizontal: 14,
          borderRadius: 18,
        },
        presetName: {
          fontSize: 14,
          lineHeight: 18,
          fontWeight: "700",
        },
        presetDesc: {
          fontSize: 12,
          lineHeight: 16,
          opacity: 0.75,
          marginTop: 2,
          marginBottom: 8,
        },
        swatchRow: {
          flexDirection: "row",
          alignItems: "center",
          gap: 6,
        },
        swatch: {
          width: 12,
          height: 12,
          borderRadius: 6,
          borderWidth: 1,
          borderColor: outlineColor,
        },
      }),
    [outlineColor]
  );

  const handleModeChange = (nextMode: ThemeMode) => {
    onThemeModeChange(nextMode);
    onChanged();
  };

  const handlePresetChange = (preset: ThemePresetKey) => {
    onThemePresetChange(preset);
    onChanged();
  };

  return (
    <SettingsSection>
      <View style={styles.titleRow}>
        <Palette color={textColor} size={18} strokeWidth={2} />
        <ThemedText style={styles.title}>主题外观</ThemedText>
      </View>
      <ThemedText style={styles.description}>切换浅色或深色模式，并选择柔和的自然风格配色。</ThemedText>

      <View style={styles.modeRow}>
        <StyledButton
          variant={themeMode === "light" ? "primary" : "default"}
          isSelected={themeMode === "light"}
          style={styles.modeButton}
          onPress={() => handleModeChange("light")}
        >
          <Sun color={themeMode === "light" ? onPrimaryColor : textColor} size={18} strokeWidth={2.2} />
          <ThemedText
            style={{ marginLeft: 8, fontWeight: "600", color: themeMode === "light" ? onPrimaryColor : textColor }}
          >
            浅色
          </ThemedText>
        </StyledButton>
        <StyledButton
          variant={themeMode === "dark" ? "primary" : "default"}
          isSelected={themeMode === "dark"}
          style={styles.modeButton}
          onPress={() => handleModeChange("dark")}
        >
          <Moon color={themeMode === "dark" ? onPrimaryColor : textColor} size={18} strokeWidth={2.2} />
          <ThemedText
            style={{ marginLeft: 8, fontWeight: "600", color: themeMode === "dark" ? onPrimaryColor : textColor }}
          >
            深色
          </ThemedText>
        </StyledButton>
      </View>

      <View style={styles.presetWrap}>
        {THEME_PRESETS.map((preset) => {
          const palette = getThemeColors(preset.key, themeMode);
          const selected = preset.key === themePreset;

          return (
            <StyledButton
              key={preset.key}
              variant={selected ? "primary" : "default"}
              isSelected={selected}
              style={styles.presetButton}
              onPress={() => handlePresetChange(preset.key)}
            >
              <View>
                <ThemedText style={[styles.presetName, { color: selected ? onPrimaryColor : textColor }]}>{preset.label}</ThemedText>
                <ThemedText style={[styles.presetDesc, { color: selected ? onPrimaryColor : textColor }]}>
                  {preset.description}
                </ThemedText>
                <View style={styles.swatchRow}>
                  <View style={[styles.swatch, { backgroundColor: palette.primary }]} />
                  <View style={[styles.swatch, { backgroundColor: palette.secondary }]} />
                  <View style={[styles.swatch, { backgroundColor: palette.tertiary }]} />
                  <View style={[styles.swatch, { backgroundColor: palette.surfaceVariant }]} />
                </View>
              </View>
            </StyledButton>
          );
        })}
      </View>
    </SettingsSection>
  );
};
