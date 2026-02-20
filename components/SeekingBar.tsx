import React, { useMemo } from "react";
import { StyleSheet, View } from "react-native";
import { ThemedText } from "@/components/ThemedText";
import { useThemeColor } from "@/hooks/useThemeColor";
import usePlayerStore from "@/stores/playerStore";

const formatTime = (milliseconds: number) => {
  if (Number.isNaN(milliseconds) || milliseconds < 0) {
    return "00:00";
  }
  const totalSeconds = Math.floor(milliseconds / 1000);
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;

  if (hours > 0) {
    return `${hours.toString().padStart(2, "0")}:${minutes.toString().padStart(2, "0")}:${seconds
      .toString()
      .padStart(2, "0")}`;
  }

  return `${minutes.toString().padStart(2, "0")}:${seconds.toString().padStart(2, "0")}`;
};

export const SeekingBar = () => {
  const { isSeeking, seekPosition, status } = usePlayerStore();

  const surface = useThemeColor({}, "surface");
  const primary = useThemeColor({}, "primary");
  const border = useThemeColor({}, "outlineVariant");

  const styles = useMemo(
    () =>
      StyleSheet.create({
        seekingContainer: {
          position: "absolute",
          bottom: 88,
          left: "6%",
          right: "6%",
          alignItems: "center",
          borderRadius: 16,
          borderWidth: 1,
          borderColor: border,
          backgroundColor: surface,
          paddingHorizontal: 14,
          paddingVertical: 12,
        },
        timeText: {
          fontSize: 15,
          lineHeight: 20,
          fontWeight: "700",
          marginBottom: 9,
        },
        seekingBarContainer: {
          width: "100%",
          height: 6,
          borderRadius: 999,
          overflow: "hidden",
          backgroundColor: "rgba(128, 128, 128, 0.32)",
        },
        seekingBarFilled: {
          height: "100%",
          backgroundColor: primary,
          borderRadius: 999,
        },
      }),
    [border, primary, surface]
  );

  if (!isSeeking || !status?.isLoaded) {
    return null;
  }

  const durationMillis = status.durationMillis || 0;
  const currentPositionMillis = seekPosition * durationMillis;

  return (
    <View style={styles.seekingContainer}>
      <ThemedText style={styles.timeText}>
        {formatTime(currentPositionMillis)} / {formatTime(durationMillis)}
      </ThemedText>
      <View style={styles.seekingBarContainer}>
        <View
          style={[
            styles.seekingBarFilled,
            {
              width: `${seekPosition * 100}%`,
            },
          ]}
        />
      </View>
    </View>
  );
};
