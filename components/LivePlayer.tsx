import React, { useRef, useState, useEffect, useCallback } from "react";
import { View, StyleSheet, Text, ActivityIndicator } from "react-native";
import { Video, ResizeMode, AVPlaybackStatus } from "expo-av";
import { useKeepAwake } from "expo-keep-awake";

interface LivePlayerProps {
  streamUrl: string | null;
  fallbackStreamUrls?: string[];
  channelTitle?: string | null;
  onPlaybackStatusUpdate: (status: AVPlaybackStatus) => void;
  onPlaybackFailure?: (reason: "error" | "timeout") => void;
}

const PLAYBACK_TIMEOUT = 15000; // 15 seconds

export default function LivePlayer({
  streamUrl,
  fallbackStreamUrls = [],
  channelTitle,
  onPlaybackStatusUpdate,
  onPlaybackFailure,
}: LivePlayerProps) {
  const video = useRef<Video>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isTimeout, setIsTimeout] = useState(false);
  const [activeStreamUrl, setActiveStreamUrl] = useState<string | null>(null);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);
  const streamQueueRef = useRef<string[]>([]);
  const streamIndexRef = useRef(0);
  const failureReportedRef = useRef(false);
  useKeepAwake();

  const switchToNextStream = useCallback(() => {
    const nextIndex = streamIndexRef.current + 1;
    const queue = streamQueueRef.current;
    if (nextIndex < queue.length) {
      streamIndexRef.current = nextIndex;
      setActiveStreamUrl(queue[nextIndex]);
      setStatusMessage("当前线路失败，已切换备用线路...");
      setIsLoading(true);
      setIsTimeout(false);
      return true;
    }
    return false;
  }, []);

  const startTimeout = useCallback(() => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }

    timeoutRef.current = setTimeout(() => {
      if (switchToNextStream()) {
        setIsLoading(true);
        startTimeout();
        return;
      }

      setIsTimeout(true);
      setIsLoading(false);
      setStatusMessage(null);
      if (!failureReportedRef.current) {
        failureReportedRef.current = true;
        onPlaybackFailure?.("timeout");
      }
    }, PLAYBACK_TIMEOUT);
  }, [onPlaybackFailure, switchToNextStream]);

  useEffect(() => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }

    if (streamUrl || fallbackStreamUrls.length > 0) {
      const queue = [streamUrl, ...fallbackStreamUrls].filter((url): url is string => !!url);
      const uniqueQueue = Array.from(new Set(queue));
      streamQueueRef.current = uniqueQueue;
      streamIndexRef.current = 0;
      failureReportedRef.current = false;
      setActiveStreamUrl(uniqueQueue[0] || null);
      setIsLoading(true);
      setIsTimeout(false);
      setStatusMessage(null);
      startTimeout();
    } else {
      streamQueueRef.current = [];
      streamIndexRef.current = 0;
      failureReportedRef.current = false;
      setActiveStreamUrl(null);
      setIsLoading(false);
      setIsTimeout(false);
      setStatusMessage(null);
    }

    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, [streamUrl, fallbackStreamUrls, startTimeout]);

  const handlePlaybackStatusUpdate = (status: AVPlaybackStatus) => {
    if (status.isLoaded) {
      if (status.isPlaying) {
        if (timeoutRef.current) {
          clearTimeout(timeoutRef.current);
        }
        setIsLoading(false);
        setIsTimeout(false);
        failureReportedRef.current = false;
        setStatusMessage(streamIndexRef.current > 0 ? "当前为备用线路" : null);
      } else if (status.isBuffering) {
        setIsLoading(true);
      }
    } else {
      if (status.error) {
        if (!switchToNextStream()) {
          setIsLoading(false);
          setIsTimeout(true);
          setStatusMessage(null);
          if (timeoutRef.current) {
            clearTimeout(timeoutRef.current);
          }
          if (!failureReportedRef.current) {
            failureReportedRef.current = true;
            onPlaybackFailure?.("error");
          }
        } else {
          startTimeout();
        }
      }
    }
    onPlaybackStatusUpdate(status);
  };

  if (!activeStreamUrl) {
    return (
      <View style={styles.container}>
        <Text style={styles.messageText}>按向下键选择频道</Text>
      </View>
    );
  }

  if (isTimeout) {
    return (
      <View style={styles.container}>
        <Text style={styles.messageText}>加载失败，请重试</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Video
        ref={video}
        style={styles.video}
        source={{
          uri: activeStreamUrl,
        }}
        resizeMode={ResizeMode.CONTAIN}
        shouldPlay
        onPlaybackStatusUpdate={handlePlaybackStatusUpdate}
        onError={(e) => {
          if (!switchToNextStream()) {
            setIsTimeout(true);
            setIsLoading(false);
            setStatusMessage(null);
            if (!failureReportedRef.current) {
              failureReportedRef.current = true;
              onPlaybackFailure?.("error");
            }
          } else {
            startTimeout();
          }
        }}
      />
      {isLoading && (
        <View style={styles.loadingOverlay}>
          <ActivityIndicator size="large" color="#fff" />
          <Text style={styles.messageText}>{statusMessage || "加载中..."}</Text>
        </View>
      )}
      {statusMessage && !isLoading && !isTimeout && (
        <View style={styles.statusOverlay}>
          <Text style={styles.statusText}>{statusMessage}</Text>
        </View>
      )}
      {channelTitle && !isLoading && !isTimeout && (
        <View style={styles.overlay}>
          <Text style={styles.title}>{channelTitle}</Text>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#000",
  },
  video: {
    flex: 1,
    alignSelf: "stretch",
  },
  overlay: {
    position: "absolute",
    top: 20,
    left: 20,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    padding: 10,
    borderRadius: 5,
  },
  title: {
    color: "#fff",
    fontSize: 18,
  },
  messageText: {
    color: "#fff",
    fontSize: 16,
    marginTop: 10,
  },
  loadingOverlay: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "rgba(0, 0, 0, 0.5)",
  },
  statusOverlay: {
    position: "absolute",
    bottom: 24,
    left: 20,
    backgroundColor: "rgba(0, 0, 0, 0.55)",
    paddingVertical: 6,
    paddingHorizontal: 10,
    borderRadius: 5,
  },
  statusText: {
    color: "#cceeff",
    fontSize: 12,
  },
});
