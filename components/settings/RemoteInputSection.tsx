import React, { useEffect, useMemo, useRef } from "react";
import { StyleSheet, View, findNodeHandle } from "react-native";
import { Wifi } from "lucide-react-native";

import { ThemedText } from "@/components/ThemedText";
import { StyledButton } from "@/components/StyledButton";
import { useThemeColor } from "@/hooks/useThemeColor";
import { useRemoteControlStore } from "@/stores/remoteControlStore";
import { useSettingsStore } from "@/stores/settingsStore";

import { SettingsSection } from "./SettingsSection";

interface RemoteInputSectionProps {
  onChanged: () => void;
  onFocus?: () => void;
  onBlur?: () => void;
  nextFocusDown?: number;
  onToggleHandleChange?: (handle: number | undefined) => void;
}

export const RemoteInputSection: React.FC<RemoteInputSectionProps> = ({
  onChanged,
  onFocus,
  onBlur,
  nextFocusDown,
  onToggleHandleChange,
}) => {
  const { remoteInputEnabled, setRemoteInputEnabled } = useSettingsStore();
  const { isServerRunning, serverUrl, error } = useRemoteControlStore();

  const textColor = useThemeColor({}, "text");
  const successColor = useThemeColor({}, "success");
  const errorColor = useThemeColor({}, "error");
  const iconColor = useThemeColor({}, "icon");
  const surfaceVariant = useThemeColor({}, "surfaceVariant");

  const toggleButtonRef = useRef<View>(null);

  const styles = useMemo(
    () =>
      StyleSheet.create({
        row: {
          flexDirection: "row",
          alignItems: "center",
          justifyContent: "space-between",
          gap: 14,
        },
        titleRow: {
          flexDirection: "row",
          alignItems: "center",
          gap: 8,
          marginBottom: 8,
        },
        title: {
          fontSize: 16,
          lineHeight: 22,
          fontWeight: "700",
        },
        description: {
          fontSize: 13,
          lineHeight: 18,
          color: iconColor,
          marginBottom: 10,
        },
        statusContainer: {
          marginTop: 14,
          padding: 14,
          borderRadius: 16,
          backgroundColor: surfaceVariant,
          gap: 8,
        },
        statusRow: {
          flexDirection: "row",
          alignItems: "flex-start",
          justifyContent: "space-between",
          gap: 8,
        },
        statusLabel: {
          fontSize: 13,
          lineHeight: 18,
          color: iconColor,
          minWidth: 100,
        },
        statusValue: {
          flex: 1,
          fontSize: 13,
          lineHeight: 18,
          color: textColor,
          textAlign: "right",
        },
        toggleButton: {
          minWidth: 140,
        },
      }),
    [iconColor, surfaceVariant, textColor]
  );

  useEffect(() => {
    const publishHandle = () => {
      const handle = findNodeHandle(toggleButtonRef.current) || undefined;
      onToggleHandleChange?.(handle);
    };

    publishHandle();
    const timer = setTimeout(publishHandle, 0);

    return () => {
      clearTimeout(timer);
      onToggleHandleChange?.(undefined);
    };
  }, [onToggleHandleChange, remoteInputEnabled]);

  const handleToggle = () => {
    setRemoteInputEnabled(!remoteInputEnabled);
    onChanged();
  };

  return (
    <SettingsSection focusable={false}>
      <View style={styles.row}>
        <View style={{ flex: 1 }}>
          <View style={styles.titleRow}>
            <Wifi color={textColor} size={18} strokeWidth={2} />
            <ThemedText style={styles.title}>远程输入</ThemedText>
          </View>
          <ThemedText style={styles.description}>允许使用手机在同一局域网内发送输入内容。</ThemedText>
        </View>

        <StyledButton
          ref={toggleButtonRef}
          text={remoteInputEnabled ? "已开启" : "已关闭"}
          variant={remoteInputEnabled ? "primary" : "default"}
          isSelected={remoteInputEnabled}
          style={styles.toggleButton}
          onPress={handleToggle}
          onFocus={onFocus}
          onBlur={onBlur}
          nextFocusDown={nextFocusDown}
        />
      </View>

      {remoteInputEnabled ? (
        <View style={styles.statusContainer}>
          <View style={styles.statusRow}>
            <ThemedText style={styles.statusLabel}>服务状态</ThemedText>
            <ThemedText style={[styles.statusValue, { color: isServerRunning ? successColor : errorColor }]}>
              {isServerRunning ? "运行中" : "未运行"}
            </ThemedText>
          </View>

          {serverUrl ? (
            <View style={styles.statusRow}>
              <ThemedText style={styles.statusLabel}>访问地址</ThemedText>
              <ThemedText style={styles.statusValue}>{serverUrl}</ThemedText>
            </View>
          ) : null}

          {error ? (
            <View style={styles.statusRow}>
              <ThemedText style={styles.statusLabel}>错误信息</ThemedText>
              <ThemedText style={[styles.statusValue, { color: errorColor }]}>{error}</ThemedText>
            </View>
          ) : null}
        </View>
      ) : null}
    </SettingsSection>
  );
};
