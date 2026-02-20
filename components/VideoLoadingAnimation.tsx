import React, { useEffect, useMemo, useRef } from "react";
import { Animated, Easing, StyleSheet, View } from "react-native";
import { useThemeColor } from "@/hooks/useThemeColor";

interface VideoLoadingAnimationProps {
  showProgressBar?: boolean;
  size?: "normal" | "compact";
  showLabel?: boolean;
  label?: string;
}

const VideoLoadingAnimation: React.FC<VideoLoadingAnimationProps> = ({
  size = "normal",
  showLabel = true,
  label = "\u6b63\u5728\u52a0\u8f7d",
}) => {
  const phase = useRef(new Animated.Value(0)).current;
  const pulse = useRef(new Animated.Value(0)).current;

  const primary = useThemeColor({}, "primary");
  const secondary = useThemeColor({}, "secondary");
  const tertiary = useThemeColor({}, "tertiary");
  const textColor = useThemeColor({}, "text");
  const surfaceVariant = useThemeColor({}, "surfaceVariant");

  const compact = size === "compact";

  useEffect(() => {
    const phaseLoop = Animated.loop(
      Animated.timing(phase, {
        toValue: 1,
        duration: compact ? 1500 : 1800,
        easing: Easing.inOut(Easing.cubic),
        useNativeDriver: true,
      })
    );

    const pulseLoop = Animated.loop(
      Animated.sequence([
        Animated.timing(pulse, {
          toValue: 1,
          duration: compact ? 700 : 900,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
        Animated.timing(pulse, {
          toValue: 0,
          duration: compact ? 700 : 900,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
      ])
    );

    phaseLoop.start();
    pulseLoop.start();

    return () => {
      phaseLoop.stop();
      pulseLoop.stop();
    };
  }, [compact, phase, pulse]);

  const styles = useMemo(
    () =>
      StyleSheet.create({
        container: {
          minHeight: compact ? 84 : 180,
          alignItems: "center",
          justifyContent: "center",
          backgroundColor: "transparent",
        },
        loaderWrap: {
          width: compact ? 62 : 96,
          height: compact ? 62 : 96,
          alignItems: "center",
          justifyContent: "center",
          borderRadius: compact ? 18 : 28,
          backgroundColor: surfaceVariant,
        },
        grid: {
          width: compact ? 38 : 56,
          height: compact ? 38 : 56,
          flexDirection: "row",
          flexWrap: "wrap",
          justifyContent: "space-between",
          alignContent: "space-between",
        },
        cell: {
          width: compact ? 16 : 24,
          height: compact ? 16 : 24,
          borderRadius: compact ? 5 : 7,
          marginBottom: compact ? 6 : 8,
        },
        text: {
          marginTop: compact ? 8 : 16,
          color: textColor,
          fontSize: compact ? 12 : 14,
          lineHeight: compact ? 16 : 20,
          letterSpacing: 0.4,
          fontWeight: "600",
        },
      }),
    [compact, surfaceVariant, textColor]
  );

  const getAnimatedStyle = (index: number) => {
    const start = index * 0.15;
    const end = Math.min(start + 0.65, 1);

    return {
      transform: [
        {
          scale: phase.interpolate({
            inputRange: [0, start, end, 1],
            outputRange: [1, 1, 0.62, 1],
            extrapolate: "clamp",
          }),
        },
        {
          rotate: phase.interpolate({
            inputRange: [0, start, end, 1],
            outputRange: ["0deg", "0deg", "45deg", "180deg"],
            extrapolate: "clamp",
          }),
        },
      ],
      opacity: pulse.interpolate({
        inputRange: [0, 1],
        outputRange: [0.78, 1],
      }),
    };
  };

  const cellColors = [primary, secondary, tertiary, primary];

  return (
    <View style={styles.container}>
      <View style={styles.loaderWrap}>
        <View style={styles.grid}>
          {cellColors.map((color, index) => (
            <Animated.View key={index} style={[styles.cell, { backgroundColor: color }, getAnimatedStyle(index)]} />
          ))}
        </View>
      </View>

      {showLabel && (
        <Animated.Text
          style={[
            styles.text,
            {
              opacity: pulse.interpolate({
                inputRange: [0, 1],
                outputRange: [0.72, 1],
              }),
            },
          ]}
        >
          {label}
        </Animated.Text>
      )}
    </View>
  );
};

export default VideoLoadingAnimation;
