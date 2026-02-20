import React, { useEffect, useMemo, useState } from "react";
import { FlatList, Image, Modal, StyleSheet, View } from "react-native";

import { useThemeColor } from "@/hooks/useThemeColor";
import { api } from "@/services/api";
import { getSourceStatsFromM3U8, M3U8SourceStats } from "@/services/m3u8";
import useDetailStore from "@/stores/detailStore";
import usePlayerStore from "@/stores/playerStore";
import Logger from "@/utils/Logger";

import { StyledButton } from "./StyledButton";
import { ThemedText } from "./ThemedText";

const logger = Logger.withTag("SourceSelectionModal");

const ITEM_HEIGHT = 132;
const METRIC_COL_WIDTH = 94;
const METRIC_COL_GAP = 8;
const MAX_CONCURRENT_TESTS = 2;

const defaultStats: M3U8SourceStats = {
  quality: "未知",
  loadSpeed: "未知",
  pingTime: 0,
  hasError: true,
};

export const SourceSelectionModal: React.FC = () => {
  const { showSourceModal, setShowSourceModal, loadVideo, currentEpisodeIndex, status } = usePlayerStore();
  const { searchResults, detail, setDetail } = useDetailStore();

  const [sourceStatsMap, setSourceStatsMap] = useState<Record<string, M3U8SourceStats>>({});
  const [testingSourceMap, setTestingSourceMap] = useState<Record<string, boolean>>({});

  const overlay = useThemeColor({}, "overlay");
  const surface = useThemeColor({}, "surface");
  const border = useThemeColor({}, "outlineVariant");
  const textColor = useThemeColor({}, "text");
  const mutedColor = useThemeColor({}, "icon");
  const onPrimaryColor = useThemeColor({}, "onPrimary");
  const secondaryColor = useThemeColor({}, "secondary");
  const tertiaryColor = useThemeColor({}, "tertiary");
  const warningColor = useThemeColor({}, "warning");
  const errorColor = useThemeColor({}, "error");

  useEffect(() => {
    if (!showSourceModal || searchResults.length === 0) {
      return;
    }

    let cancelled = false;

    const getSourceKey = (source: { source: string; id: string | number }) => `${source.source}-${source.id}-${currentEpisodeIndex}`;

    const resolveEpisodeUrl = (episodes: string[] | undefined) => {
      if (!episodes || episodes.length === 0) {
        return null;
      }

      const normalizedEpisodes = episodes.map((episode) => episode?.trim()).filter(Boolean) as string[];
      if (normalizedEpisodes.length === 0) {
        return null;
      }

      const safeEpisodeIndex = Math.min(Math.max(currentEpisodeIndex, 0), normalizedEpisodes.length - 1);
      return normalizedEpisodes[safeEpisodeIndex] || normalizedEpisodes[0];
    };

    const pendingSources = searchResults.filter((source) => {
      const sourceKey = getSourceKey(source);
      return !sourceStatsMap[sourceKey] && !testingSourceMap[sourceKey];
    });

    if (pendingSources.length === 0) {
      return;
    }

    setTestingSourceMap((prev) => {
      const nextMap = { ...prev };
      pendingSources.forEach((source) => {
        nextMap[getSourceKey(source)] = true;
      });
      return nextMap;
    });

    const runTests = async () => {
      for (let i = 0; i < pendingSources.length; i += MAX_CONCURRENT_TESTS) {
        if (cancelled) {
          break;
        }

        const sourceBatch = pendingSources.slice(i, i + MAX_CONCURRENT_TESTS);

        await Promise.all(
          sourceBatch.map(async (source) => {
            const sourceKey = getSourceKey(source);
            const episodeUrl = resolveEpisodeUrl(source.episodes);

            if (!episodeUrl) {
              if (!cancelled) {
                setSourceStatsMap((prev) => ({
                  ...prev,
                  [sourceKey]: defaultStats,
                }));
              }
              setTestingSourceMap((prev) => ({
                ...prev,
                [sourceKey]: false,
              }));
              return;
            }

            try {
              const stats = await getSourceStatsFromM3U8(episodeUrl, { sourceKey: source.source });
              if (!cancelled) {
                setSourceStatsMap((prev) => ({
                  ...prev,
                  [sourceKey]: stats,
                }));
              }
            } catch (error) {
              logger.info("Source speed test failed", error);
              if (!cancelled) {
                setSourceStatsMap((prev) => ({
                  ...prev,
                  [sourceKey]: defaultStats,
                }));
              }
            } finally {
              setTestingSourceMap((prev) => ({
                ...prev,
                [sourceKey]: false,
              }));
            }
          })
        );
      }
    };

    void runTests();

    return () => {
      cancelled = true;
    };
  }, [currentEpisodeIndex, searchResults, showSourceModal]);

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
          width: 660,
          height: "100%",
          backgroundColor: surface,
          paddingHorizontal: 18,
          paddingTop: 18,
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
          marginBottom: 10,
          textAlign: "center",
          color: mutedColor,
          fontSize: 13,
          lineHeight: 18,
        },
        legendRow: {
          flexDirection: "row",
          justifyContent: "flex-end",
          alignItems: "center",
          gap: METRIC_COL_GAP,
          paddingRight: 4,
          marginBottom: 10,
        },
        legendTag: {
          width: METRIC_COL_WIDTH,
          borderRadius: 8,
          paddingHorizontal: 8,
          paddingVertical: 4,
          alignItems: "center",
          backgroundColor: `${secondaryColor}26`,
        },
        legendText: {
          fontSize: 12,
          lineHeight: 16,
          fontWeight: "600",
          color: textColor,
        },
        sourceList: {
          paddingBottom: 22,
        },
        sourceItem: {
          width: "100%",
          minHeight: ITEM_HEIGHT,
          marginBottom: 12,
          justifyContent: "flex-start",
          paddingVertical: 10,
          paddingHorizontal: 10,
        },
        sourceCard: {
          flexDirection: "row",
          alignItems: "stretch",
          width: "100%",
        },
        poster: {
          width: 56,
          height: 84,
          borderRadius: 7,
          marginRight: 12,
        },
        sourceBody: {
          flex: 1,
          flexDirection: "row",
          alignItems: "stretch",
          justifyContent: "space-between",
          gap: 12,
        },
        sourceInfo: {
          flex: 1,
          justifyContent: "space-between",
        },
        sourceTopRow: {
          flexDirection: "row",
          alignItems: "center",
        },
        sourceTitle: {
          flex: 1,
          fontSize: 17,
          lineHeight: 23,
          fontWeight: "700",
        },
        sourceMiddleRow: {
          flexDirection: "row",
          justifyContent: "space-between",
          alignItems: "center",
          gap: 12,
        },
        sourceNameBadge: {
          borderRadius: 8,
          borderWidth: 1,
          borderColor: border,
          paddingHorizontal: 8,
          paddingVertical: 4,
          backgroundColor: `${secondaryColor}1A`,
        },
        sourceNameText: {
          fontSize: 12,
          lineHeight: 16,
          fontWeight: "600",
        },
        episodeCountText: {
          fontSize: 13,
          lineHeight: 18,
          fontWeight: "600",
        },
        sourceHintRow: {
          minHeight: 18,
          justifyContent: "center",
        },
        loadingText: {
          fontSize: 12,
          lineHeight: 16,
          fontWeight: "600",
          color: mutedColor,
        },
        errorText: {
          fontSize: 12,
          lineHeight: 16,
          fontWeight: "600",
          color: errorColor,
        },
        metricsRow: {
          flexDirection: "row",
          alignItems: "center",
          gap: METRIC_COL_GAP,
        },
        metricCol: {
          width: METRIC_COL_WIDTH,
          minHeight: 42,
          borderRadius: 10,
          borderWidth: 1,
          borderColor: border,
          backgroundColor: `${secondaryColor}14`,
          justifyContent: "center",
          alignItems: "center",
          paddingHorizontal: 6,
        },
        metricText: {
          fontSize: 13,
          lineHeight: 18,
          fontWeight: "700",
        },
      }),
    [border, errorColor, mutedColor, overlay, secondaryColor, surface, textColor]
  );

  const onSelectSource = (index: number) => {
    logger.debug("onSelectSource", index, searchResults[index].source, detail?.source);

    if (searchResults[index].source !== detail?.source) {
      const newDetail = searchResults[index];
      setDetail(newDetail);

      const currentPosition = status?.isLoaded ? status.positionMillis : undefined;
      loadVideo({
        source: newDetail.source,
        id: newDetail.id.toString(),
        episodeIndex: currentEpisodeIndex,
        title: newDetail.title,
        position: currentPosition,
      });
    }

    setShowSourceModal(false);
  };

  const currentSourceName = detail?.source_name || "未选择";

  return (
    <Modal visible={showSourceModal} transparent animationType="slide" onRequestClose={() => setShowSourceModal(false)}>
      <View style={styles.modalContainer}>
        <View style={styles.modalContent}>
          <ThemedText style={styles.modalTitle}>播放源</ThemedText>
          <ThemedText style={styles.modalSubtitle}>{`当前：${currentSourceName}`}</ThemedText>

          <View style={styles.legendRow}>
            <View style={styles.legendTag}>
              <ThemedText style={styles.legendText}>画质</ThemedText>
            </View>
            <View style={styles.legendTag}>
              <ThemedText style={styles.legendText}>加载速度</ThemedText>
            </View>
            <View style={styles.legendTag}>
              <ThemedText style={styles.legendText}>延迟</ThemedText>
            </View>
          </View>

          <FlatList
            data={searchResults}
            contentContainerStyle={styles.sourceList}
            keyExtractor={(item, index) => `source-${item.source}-${index}`}
            getItemLayout={(_, index) => ({ length: ITEM_HEIGHT + 12, offset: (ITEM_HEIGHT + 12) * index, index })}
            renderItem={({ item, index }) => {
              const sourceKey = `${item.source}-${item.id}-${currentEpisodeIndex}`;
              const stats = sourceStatsMap[sourceKey] || defaultStats;
              const testing = Boolean(testingSourceMap[sourceKey]);
              const selected = detail?.source === item.source;

              const quality = stats.quality || item.resolution || "未知";
              const speedValue = testing ? "测速中" : stats.hasError ? "--" : stats.loadSpeed;
              const pingValue = testing ? "测速中" : stats.hasError ? "--" : `${stats.pingTime}ms`;

              const qualityColor = ["4K", "2K"].includes(quality)
                ? secondaryColor
                : ["1080p", "720p"].includes(quality)
                  ? tertiaryColor
                  : warningColor;
              const speedColor = testing || stats.hasError ? mutedColor : tertiaryColor;
              const pingColor = testing || stats.hasError ? mutedColor : warningColor;

              const sourceName = item.source_name || `播放源 ${index + 1}`;

              return (
                <StyledButton
                  onPress={() => onSelectSource(index)}
                  isSelected={selected}
                  hasTVPreferredFocus={selected}
                  variant={selected ? "primary" : "default"}
                  style={styles.sourceItem}
                >
                  <View style={styles.sourceCard}>
                    <Image source={{ uri: api.getImageProxyUrl(item.poster || "") }} style={styles.poster} />

                    <View style={styles.sourceBody}>
                      <View style={styles.sourceInfo}>
                        <View style={styles.sourceTopRow}>
                          <ThemedText
                            numberOfLines={1}
                            style={{
                              ...styles.sourceTitle,
                              color: selected ? onPrimaryColor : textColor,
                            }}
                          >
                            {item.title || "未知标题"}
                          </ThemedText>
                        </View>

                        <View style={styles.sourceMiddleRow}>
                          <View style={styles.sourceNameBadge}>
                            <ThemedText
                              style={{
                                ...styles.sourceNameText,
                                color: selected ? onPrimaryColor : textColor,
                              }}
                            >
                              {sourceName}
                            </ThemedText>
                          </View>

                          <ThemedText
                            style={{
                              ...styles.episodeCountText,
                              color: selected ? onPrimaryColor : mutedColor,
                            }}
                          >
                            {`${item.episodes?.length || 0} 集`}
                          </ThemedText>
                        </View>

                        <View style={styles.sourceHintRow}>
                          {testing ? (
                            <ThemedText style={{ ...styles.loadingText, color: selected ? onPrimaryColor : mutedColor }}>正在测速...</ThemedText>
                          ) : stats.hasError ? (
                            <ThemedText style={{ ...styles.errorText, color: selected ? onPrimaryColor : errorColor }}>未获取测速数据</ThemedText>
                          ) : null}
                        </View>
                      </View>

                      <View style={styles.metricsRow}>
                        <View style={styles.metricCol}>
                          <ThemedText style={{ ...styles.metricText, color: selected ? onPrimaryColor : qualityColor }}>{quality}</ThemedText>
                        </View>
                        <View style={styles.metricCol}>
                          <ThemedText style={{ ...styles.metricText, color: selected ? onPrimaryColor : speedColor }}>{speedValue}</ThemedText>
                        </View>
                        <View style={styles.metricCol}>
                          <ThemedText style={{ ...styles.metricText, color: selected ? onPrimaryColor : pingColor }}>{pingValue}</ThemedText>
                        </View>
                      </View>
                    </View>
                  </View>
                </StyledButton>
              );
            }}
          />
        </View>
      </View>
    </Modal>
  );
};
