import React, { ComponentProps } from "react";
import { StyleSheet, View } from "react-native";
import { StyledButton } from "./StyledButton";
import { ThemedText } from "./ThemedText";

type StyledButtonProps = ComponentProps<typeof StyledButton> & {
  timeLabel?: string;
};

export const MediaButton = ({ timeLabel, ...props }: StyledButtonProps) => (
  <View style={styles.container}>
    <StyledButton {...props} style={[styles.mediaControlButton, props.style]} variant="ghost" />
    {timeLabel ? <ThemedText style={styles.timeLabel}>{timeLabel}</ThemedText> : null}
  </View>
);

const styles = StyleSheet.create({
  container: {
    alignItems: "center",
    justifyContent: "center",
    minWidth: 86,
  },
  mediaControlButton: {
    paddingVertical: 10,
    paddingHorizontal: 12,
    minWidth: 82,
  },
  timeLabel: {
    marginTop: 6,
    fontSize: 12,
    lineHeight: 16,
    opacity: 0.9,
  },
});
