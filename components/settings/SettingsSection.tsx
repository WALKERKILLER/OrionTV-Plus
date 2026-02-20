import React, { useMemo, useState } from "react";
import { Pressable, StyleSheet } from "react-native";
import { ThemedView } from "@/components/ThemedView";
import { useThemeColor } from "@/hooks/useThemeColor";

interface SettingsSectionProps {
  children: React.ReactNode;
  onFocus?: () => void;
  onBlur?: () => void;
  onPress?: () => void;
  focusable?: boolean;
}

export const SettingsSection: React.FC<SettingsSectionProps> = ({
  children,
  onFocus,
  onBlur,
  onPress,
  focusable = false,
}) => {
  const [isFocused, setIsFocused] = useState(false);

  const surfaceColor = useThemeColor({}, "surface");
  const borderColor = useThemeColor({}, "outlineVariant");
  const focusRingColor = useThemeColor({}, "focusRing");
  const overlayColor = useThemeColor({}, "overlay");

  const styles = useMemo(
    () =>
      StyleSheet.create({
        section: {
          padding: 20,
          marginBottom: 16,
          borderRadius: 24,
          borderWidth: 1,
          borderColor,
          backgroundColor: surfaceColor,
        },
        sectionFocused: {
          borderColor: focusRingColor,
          shadowColor: focusRingColor,
          shadowOffset: { width: 0, height: 0 },
          shadowOpacity: 0.32,
          shadowRadius: 12,
          elevation: 4,
          backgroundColor: overlayColor,
        },
        sectionPressable: {
          width: "100%",
        },
      }),
    [borderColor, focusRingColor, overlayColor, surfaceColor]
  );

  const handleFocus = () => {
    setIsFocused(true);
    onFocus?.();
  };

  const handleBlur = () => {
    setIsFocused(false);
    onBlur?.();
  };

  if (!focusable) {
    return <ThemedView style={styles.section}>{children}</ThemedView>;
  }

  return (
    <ThemedView style={[styles.section, isFocused && styles.sectionFocused]}>
      <Pressable focusable style={styles.sectionPressable} onFocus={handleFocus} onBlur={handleBlur} onPress={onPress}>
        {children}
      </Pressable>
    </ThemedView>
  );
};
