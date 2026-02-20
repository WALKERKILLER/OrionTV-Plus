import React, { useMemo } from "react";
import { StyleSheet, View } from "react-native";
import {
  ArrowDownToDot,
  ArrowUpFromDot,
  Gauge,
  List,
  Pause,
  Play,
  Shield,
  SkipForward,
  Tv,
} from "lucide-react-native";
import { MediaButton } from "@/components/MediaButton";
import { ThemedText } from "@/components/ThemedText";
import { useThemeColor } from "@/hooks/useThemeColor";
import usePlayerStore from "@/stores/playerStore";
import useDetailStore from "@/stores/detailStore";
import { useSettingsStore } from "@/stores/settingsStore";
import { useSources } from "@/stores/sourceStore";

interface PlayerControlsProps {
  showControls: boolean;
  setShowControls: (show: boolean) => void;
}

const formatEpisodeLabel = (title: string | undefined, episodeIndex: number) => {
  if (title && /第\s*\d+\s*集/.test(title)) {
    return title;
  }

  if (title) {
    const matched = title.match(/(?:episode|ep)\s*([0-9]+)/i);
    if (matched) {
      return `第 ${matched[1]} 集`;
    }

    return title;
  }

  return `第 ${episodeIndex + 1} 集`;
};

export const PlayerControls: React.FC<PlayerControlsProps> = ({ showControls }) => {
  const {
    currentEpisodeIndex,
    episodes,
    status,
    isSeeking,
    seekPosition,
    progressPosition,
    playbackRate,
    togglePlayPause,
    playEpisode,
    setShowEpisodeModal,
    setShowSourceModal,
    setShowSpeedModal,
    setIntroEndTime,
    setOutroStartTime,
    refreshEpisodeUrls,
    introEndTime,
    outroStartTime,
  } = usePlayerStore();

  const { detail } = useDetailStore();
  const resources = useSources();
  const { vodAdBlockEnabled, setVodAdBlockEnabled } = useSettingsStore();

  const textColor = useThemeColor({}, "text");
  const overlayColor = useThemeColor({}, "overlay");
  const cardColor = useThemeColor({}, "surface");
  const borderColor = useThemeColor({}, "outlineVariant");
  const primaryColor = useThemeColor({}, "primary");
  const onPrimaryColor = useThemeColor({}, "onPrimary");

  const styles = useMemo(
    () =>
      StyleSheet.create({
        controlsOverlay: {
          ...StyleSheet.absoluteFillObject,
          backgroundColor: overlayColor,
          justifyContent: "space-between",
          paddingHorizontal: 24,
          paddingVertical: 20,
        },
        topPanel: {
          borderRadius: 22,
          borderWidth: 1,
          borderColor,
          backgroundColor: cardColor,
          paddingVertical: 14,
          paddingHorizontal: 18,
        },
        title: {
          color: textColor,
          fontSize: 18,
          lineHeight: 24,
          fontWeight: "700",
          textAlign: "center",
        },
        bottomPanel: {
          borderRadius: 24,
          borderWidth: 1,
          borderColor,
          backgroundColor: cardColor,
          padding: 18,
        },
        progressTrack: {
          height: 8,
          borderRadius: 999,
          backgroundColor: "rgba(127, 127, 127, 0.28)",
          overflow: "hidden",
        },
        progressFill: {
          height: 8,
          borderRadius: 999,
          backgroundColor: primaryColor,
        },
        timeText: {
          color: textColor,
          marginTop: 8,
          fontSize: 14,
          lineHeight: 18,
          textAlign: "center",
          opacity: 0.85,
        },
        controlsRow: {
          flexDirection: "row",
          justifyContent: "center",
          alignItems: "center",
          flexWrap: "wrap",
          gap: 12,
          marginTop: 14,
        },
        adIconWrap: {
          width: 30,
          height: 30,
          borderRadius: 15,
          justifyContent: "center",
          alignItems: "center",
          borderWidth: 1,
          borderColor: vodAdBlockEnabled ? primaryColor : borderColor,
          backgroundColor: vodAdBlockEnabled ? primaryColor : "transparent",
        },
      }),
    [borderColor, cardColor, overlayColor, primaryColor, textColor, vodAdBlockEnabled]
  );

  const videoTitle = detail?.title || "";
  const currentEpisode = episodes[currentEpisodeIndex];
  const currentEpisodeTitle = useMemo(
    () => formatEpisodeLabel(currentEpisode?.title, currentEpisodeIndex),
    [currentEpisode?.title, currentEpisodeIndex]
  );
  const currentSource = resources.find((resource) => resource.source === detail?.source);
  const currentSourceName = currentSource?.source_name;
  const hasNextEpisode = currentEpisodeIndex < (episodes.length || 0) - 1;

  const formatTime = (milliseconds: number) => {
    if (!milliseconds) {
      return "00:00";
    }

    const totalSeconds = Math.floor(milliseconds / 1000);
    const minutes = Math.floor(totalSeconds / 60);
    const seconds = totalSeconds % 60;
    return `${minutes.toString().padStart(2, "0")}:${seconds.toString().padStart(2, "0")}`;
  };

  const onPlayNextEpisode = () => {
    if (hasNextEpisode) {
      playEpisode(currentEpisodeIndex + 1);
    }
  };

  const onToggleVodAdBlock = () => {
    setVodAdBlockEnabled(!vodAdBlockEnabled);
    refreshEpisodeUrls();
  };

  return (
    <View style={styles.controlsOverlay} pointerEvents={showControls ? "auto" : "none"}>
      <View style={styles.topPanel}>
        <ThemedText style={styles.title}>
          {videoTitle} {currentEpisodeTitle ? `- ${currentEpisodeTitle}` : ""} {currentSourceName ? `(${currentSourceName})` : ""}
        </ThemedText>
      </View>

      <View style={styles.bottomPanel}>
        <View style={styles.progressTrack}>
          <View
            style={[
              styles.progressFill,
              {
                width: `${(isSeeking ? seekPosition : progressPosition) * 100}%`,
              },
            ]}
          />
        </View>

        <ThemedText style={styles.timeText}>
          {status?.isLoaded
            ? `${formatTime(status.positionMillis)} / ${formatTime(status.durationMillis || 0)}`
            : "00:00 / 00:00"}
        </ThemedText>

        <View style={styles.controlsRow}>
          <MediaButton onPress={setIntroEndTime} timeLabel={introEndTime ? formatTime(introEndTime) : undefined}>
            <ArrowDownToDot color={textColor} size={24} />
          </MediaButton>

          <MediaButton onPress={togglePlayPause} hasTVPreferredFocus={showControls}>
            {status?.isLoaded && status.isPlaying ? <Pause color={textColor} size={24} /> : <Play color={textColor} size={24} />}
          </MediaButton>

          <MediaButton onPress={onPlayNextEpisode} disabled={!hasNextEpisode}>
            <SkipForward color={hasNextEpisode ? textColor : borderColor} size={24} />
          </MediaButton>

          <MediaButton onPress={setOutroStartTime} timeLabel={outroStartTime ? formatTime(outroStartTime) : undefined}>
            <ArrowUpFromDot color={textColor} size={24} />
          </MediaButton>

          <MediaButton onPress={() => setShowEpisodeModal(true)}>
            <List color={textColor} size={24} />
          </MediaButton>

          <MediaButton onPress={() => setShowSpeedModal(true)} timeLabel={playbackRate !== 1.0 ? `${playbackRate}x` : undefined}>
            <Gauge color={textColor} size={24} />
          </MediaButton>

          <MediaButton onPress={onToggleVodAdBlock} isSelected={vodAdBlockEnabled}>
            <View style={styles.adIconWrap}>
              <Shield color={vodAdBlockEnabled ? onPrimaryColor : textColor} size={18} strokeWidth={2.4} />
            </View>
          </MediaButton>

          <MediaButton onPress={() => setShowSourceModal(true)}>
            <Tv color={textColor} size={24} />
          </MediaButton>
        </View>
      </View>
    </View>
  );
};
