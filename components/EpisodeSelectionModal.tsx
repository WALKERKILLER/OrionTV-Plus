import React, { useEffect, useMemo, useRef } from "react";
import { FlatList, Modal, StyleSheet, View } from "react-native";
import { StyledButton } from "./StyledButton";
import { ThemedText } from "./ThemedText";
import { useThemeColor } from "@/hooks/useThemeColor";
import usePlayerStore from "@/stores/playerStore";

const ITEM_HEIGHT = 56;

type EpisodeItem = {
  index: number;
  label: string;
};

export const EpisodeSelectionModal: React.FC = () => {
  const { showEpisodeModal, episodes, currentEpisodeIndex, playEpisode, setShowEpisodeModal } = usePlayerStore();

  const listRef = useRef<FlatList<EpisodeItem>>(null);

  const overlay = useThemeColor({}, "overlay");
  const surface = useThemeColor({}, "surface");
  const border = useThemeColor({}, "outlineVariant");
  const textColor = useThemeColor({}, "text");
  const iconColor = useThemeColor({}, "icon");

  const episodeItems = useMemo(
    () =>
      episodes.map((episode, index) => ({
        index,
        label: episode.title?.trim() || `第 ${index + 1} 集`,
      })),
    [episodes]
  );

  useEffect(() => {
    if (!showEpisodeModal || episodeItems.length === 0) {
      return;
    }

    const targetIndex = Math.max(0, Math.min(currentEpisodeIndex, episodeItems.length - 1));

    const timer = setTimeout(() => {
      listRef.current?.scrollToIndex({
        index: targetIndex,
        animated: false,
        viewPosition: 0.42,
      });
    }, 120);

    return () => clearTimeout(timer);
  }, [currentEpisodeIndex, episodeItems.length, showEpisodeModal]);

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
          padding: 20,
          borderLeftWidth: 1,
          borderLeftColor: border,
        },
        modalTitle: {
          color: textColor,
          textAlign: "center",
          fontSize: 20,
          lineHeight: 28,
          fontWeight: "700",
        },
        modalSubtitle: {
          marginTop: 4,
          marginBottom: 14,
          textAlign: "center",
          color: iconColor,
          fontSize: 13,
          lineHeight: 18,
        },
        episodeList: {
          paddingBottom: 24,
        },
        episodeItem: {
          width: "100%",
          marginBottom: 10,
          minHeight: ITEM_HEIGHT,
          justifyContent: "flex-start",
        },
        episodeItemText: {
          fontSize: 14,
          lineHeight: 20,
          textAlign: "left",
        },
      }),
    [border, iconColor, overlay, surface, textColor]
  );

  const onSelectEpisode = (index: number) => {
    playEpisode(index);
    setShowEpisodeModal(false);
  };

  const currentLabel = `当前：第 ${Math.max(currentEpisodeIndex + 1, 1)} 集`;

  return (
    <Modal visible={showEpisodeModal} transparent animationType="slide" onRequestClose={() => setShowEpisodeModal(false)}>
      <View style={styles.modalContainer}>
        <View style={styles.modalContent}>
          <ThemedText style={styles.modalTitle}>{"选集"}</ThemedText>
          <ThemedText style={styles.modalSubtitle}>{currentLabel}</ThemedText>

          <FlatList
            ref={listRef}
            data={episodeItems}
            contentContainerStyle={styles.episodeList}
            keyExtractor={(item) => `episode-${item.index}`}
            getItemLayout={(_, index) => ({ length: ITEM_HEIGHT + 10, offset: (ITEM_HEIGHT + 10) * index, index })}
            onScrollToIndexFailed={(info) => {
              listRef.current?.scrollToOffset({
                offset: Math.max(info.averageItemLength * info.index, 0),
                animated: false,
              });
            }}
            renderItem={({ item }) => (
              <StyledButton
                text={item.label}
                onPress={() => onSelectEpisode(item.index)}
                isSelected={currentEpisodeIndex === item.index}
                hasTVPreferredFocus={currentEpisodeIndex === item.index}
                style={styles.episodeItem}
                textStyle={styles.episodeItemText}
              />
            )}
          />
        </View>
      </View>
    </Modal>
  );
};
