import React, { useMemo } from "react";
import { FlatList, Modal, StyleSheet, View } from "react-native";
import { StyledButton } from "./StyledButton";
import { ThemedText } from "./ThemedText";
import { useThemeColor } from "@/hooks/useThemeColor";
import usePlayerStore from "@/stores/playerStore";

interface SpeedOption {
  rate: number;
  label: string;
}

const SPEED_OPTIONS: SpeedOption[] = [
  { rate: 0.5, label: "0.5x" },
  { rate: 0.75, label: "0.75x" },
  { rate: 1.0, label: "1x" },
  { rate: 1.25, label: "1.25x" },
  { rate: 1.5, label: "1.5x" },
  { rate: 1.75, label: "1.75x" },
  { rate: 2.0, label: "2x" },
];

export const SpeedSelectionModal: React.FC = () => {
  const { showSpeedModal, setShowSpeedModal, playbackRate, setPlaybackRate } = usePlayerStore();

  const overlay = useThemeColor({}, "overlay");
  const surface = useThemeColor({}, "surface");
  const border = useThemeColor({}, "outlineVariant");
  const textColor = useThemeColor({}, "text");

  const styles = useMemo(
    () =>
      StyleSheet.create({
        modalContainer: {
          flex: 1,
          flexDirection: "row",
          justifyContent: "flex-end",
          backgroundColor: overlay,
        },
        modalContent: {
          width: 520,
          height: "100%",
          backgroundColor: surface,
          padding: 22,
          borderLeftWidth: 1,
          borderLeftColor: border,
        },
        modalTitle: {
          color: textColor,
          marginBottom: 14,
          textAlign: "center",
          fontSize: 20,
          lineHeight: 26,
          fontWeight: "700",
        },
        speedList: {
          justifyContent: "flex-start",
          paddingBottom: 20,
        },
        speedItem: {
          margin: 4,
          width: "30%",
        },
        speedItemText: {
          fontSize: 14,
        },
      }),
    [border, overlay, surface, textColor]
  );

  const onSelectSpeed = (rate: number) => {
    setPlaybackRate(rate);
    setShowSpeedModal(false);
  };

  return (
    <Modal visible={showSpeedModal} transparent animationType="slide" onRequestClose={() => setShowSpeedModal(false)}>
      <View style={styles.modalContainer}>
        <View style={styles.modalContent}>
          <ThemedText style={styles.modalTitle}>播放速度</ThemedText>
          <FlatList
            data={SPEED_OPTIONS}
            numColumns={3}
            contentContainerStyle={styles.speedList}
            keyExtractor={(item) => `speed-${item.rate}`}
            renderItem={({ item }) => (
              <StyledButton
                text={item.label}
                onPress={() => onSelectSpeed(item.rate)}
                isSelected={playbackRate === item.rate}
                hasTVPreferredFocus={playbackRate === item.rate}
                style={styles.speedItem}
                textStyle={styles.speedItemText}
              />
            )}
          />
        </View>
      </View>
    </Modal>
  );
};

