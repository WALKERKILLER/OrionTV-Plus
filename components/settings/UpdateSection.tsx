import React, { useMemo, useState } from "react";
import { ActivityIndicator, StyleSheet, View } from "react-native";
import { DownloadCloud } from "lucide-react-native";
import { StyledButton } from "../StyledButton";
import { ThemedText } from "../ThemedText";
import { SettingsSection } from "./SettingsSection";
import { useThemeColor } from "@/hooks/useThemeColor";
import { useUpdateStore } from "@/stores/updateStore";

export function UpdateSection() {
  const {
    currentVersion,
    remoteVersion,
    updateAvailable,
    downloading,
    downloadProgress,
    checkForUpdate,
    isLatestVersion,
    error,
  } = useUpdateStore();

  const [checking, setChecking] = useState(false);

  const textColor = useThemeColor({}, "text");
  const iconColor = useThemeColor({}, "icon");
  const successColor = useThemeColor({}, "success");
  const errorColor = useThemeColor({}, "error");
  const onPrimaryColor = useThemeColor({}, "onPrimary");

  const styles = useMemo(
    () =>
      StyleSheet.create({
        titleRow: {
          flexDirection: "row",
          alignItems: "center",
          gap: 8,
          marginBottom: 10,
        },
        title: {
          fontSize: 18,
          lineHeight: 24,
          fontWeight: "700",
        },
        row: {
          flexDirection: "row",
          justifyContent: "space-between",
          alignItems: "center",
          marginBottom: 10,
          gap: 12,
        },
        label: {
          fontSize: 14,
          lineHeight: 20,
          color: iconColor,
        },
        value: {
          flex: 1,
          textAlign: "right",
          fontSize: 14,
          lineHeight: 20,
          color: textColor,
        },
        buttonRow: {
          marginTop: 14,
        },
        button: {
          minWidth: 180,
          alignSelf: "flex-end",
        },
      }),
    [iconColor, textColor]
  );

  const handleCheckUpdate = async () => {
    setChecking(true);
    try {
      await checkForUpdate(false);
    } finally {
      setChecking(false);
    }
  };

  return (
    <SettingsSection>
      <View style={styles.titleRow}>
        <DownloadCloud color={textColor} size={18} strokeWidth={2} />
        <ThemedText style={styles.title}>应用更新</ThemedText>
      </View>

      <View style={styles.row}>
        <ThemedText style={styles.label}>当前版本</ThemedText>
        <ThemedText style={styles.value}>v{currentVersion}</ThemedText>
      </View>

      {updateAvailable ? (
        <View style={styles.row}>
          <ThemedText style={styles.label}>最新版本</ThemedText>
          <ThemedText style={[styles.value, { color: successColor }]}>v{remoteVersion}</ThemedText>
        </View>
      ) : null}

      {isLatestVersion && remoteVersion ? (
        <View style={styles.row}>
          <ThemedText style={styles.label}>状态</ThemedText>
          <ThemedText style={[styles.value, { color: successColor }]}>已是最新版</ThemedText>
        </View>
      ) : null}

      {error ? (
        <View style={styles.row}>
          <ThemedText style={styles.label}>检查结果</ThemedText>
          <ThemedText style={[styles.value, { color: errorColor }]}>{error}</ThemedText>
        </View>
      ) : null}

      {downloading ? (
        <View style={styles.row}>
          <ThemedText style={styles.label}>下载进度</ThemedText>
          <ThemedText style={styles.value}>{downloadProgress}%</ThemedText>
        </View>
      ) : null}

      <View style={styles.buttonRow}>
        <StyledButton onPress={handleCheckUpdate} disabled={checking || downloading} style={styles.button} variant="primary">
          {checking ? (
            <ActivityIndicator color={onPrimaryColor} size="small" />
          ) : (
            <ThemedText style={{ color: onPrimaryColor, fontWeight: "700" }}>检查更新</ThemedText>
          )}
        </StyledButton>
      </View>
    </SettingsSection>
  );
}
