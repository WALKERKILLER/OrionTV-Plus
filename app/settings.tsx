import React, { useEffect, useMemo, useRef, useState } from "react";
import { Alert, Platform, StyleSheet, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { KeyboardAwareScrollView } from "react-native-keyboard-aware-scroll-view";
import Toast from "react-native-toast-message";
import { ThemedText } from "@/components/ThemedText";
import { ThemedView } from "@/components/ThemedView";
import { StyledButton } from "@/components/StyledButton";
import { APIConfigSection } from "@/components/settings/APIConfigSection";
import { RemoteInputSection } from "@/components/settings/RemoteInputSection";
import { ThemeSection } from "@/components/settings/ThemeSection";
import { UpdateSection } from "@/components/settings/UpdateSection";
import ResponsiveHeader from "@/components/navigation/ResponsiveHeader";
import ResponsiveNavigation from "@/components/navigation/ResponsiveNavigation";
import { useThemeColor } from "@/hooks/useThemeColor";
import { useResponsiveLayout } from "@/hooks/useResponsiveLayout";
import { useRemoteControlStore } from "@/stores/remoteControlStore";
import { useSettingsStore } from "@/stores/settingsStore";
import { DeviceUtils } from "@/utils/DeviceUtils";

type SectionItem = {
  component: React.ReactElement;
  key: string;
};

function isSectionItem(item: false | SectionItem): item is SectionItem {
  return Boolean(item);
}

export default function SettingsScreen() {
  const {
    loadSettings,
    saveSettings,
    setApiBaseUrl,
    themePreset,
    themeMode,
    setThemePreset,
    setThemeMode,
  } = useSettingsStore();

  const { lastMessage, targetPage, clearMessage } = useRemoteControlStore();

  const backgroundColor = useThemeColor({}, "background");
  const surfaceColor = useThemeColor({}, "surface");
  const borderColor = useThemeColor({}, "outlineVariant");
  const titleColor = useThemeColor({}, "text");

  const insets = useSafeAreaInsets();
  const { deviceType, spacing } = useResponsiveLayout();

  const [hasChanges, setHasChanges] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [currentSection, setCurrentSection] = useState<string | null>(null);
  const [remoteToggleHandle, setRemoteToggleHandle] = useState<number | undefined>(undefined);
  const [apiPrimaryInputHandle, setApiPrimaryInputHandle] = useState<number | undefined>(undefined);

  const apiSectionRef = useRef<any>(null);

  useEffect(() => {
    loadSettings();
  }, [loadSettings]);

  useEffect(() => {
    if (lastMessage && !targetPage) {
      const realMessage = lastMessage.split("_")[0];
      if (currentSection === "api" && apiSectionRef.current) {
        setApiBaseUrl(realMessage);
        setHasChanges(true);
      }
      clearMessage();
    }
  }, [clearMessage, currentSection, lastMessage, setApiBaseUrl, targetPage]);

  const handleSave = async () => {
    setIsLoading(true);
    try {
      await saveSettings();
      setHasChanges(false);
      Toast.show({
        type: "success",
        text1: "设置已保存",
      });
    } catch {
      Alert.alert("保存失败", "请稍后重试。");
    } finally {
      setIsLoading(false);
    }
  };

  const markAsChanged = () => {
    setHasChanges(true);
  };

  const rawSections = [
    {
      component: (
        <ThemeSection
          themePreset={themePreset}
          themeMode={themeMode}
          onThemePresetChange={setThemePreset}
          onThemeModeChange={setThemeMode}
          onChanged={markAsChanged}
        />
      ),
      key: "theme",
    },
    deviceType !== "mobile" && {
      component: (
        <RemoteInputSection
          onChanged={markAsChanged}
          onFocus={() => {
            setCurrentSection("remote");
          }}
          nextFocusDown={apiPrimaryInputHandle}
          onToggleHandleChange={setRemoteToggleHandle}
        />
      ),
      key: "remote",
    },
    {
      component: (
        <APIConfigSection
          ref={apiSectionRef}
          onChanged={markAsChanged}
          hideDescription={deviceType === "mobile"}
          onFocus={() => {
            setCurrentSection("api");
          }}
          nextFocusUp={remoteToggleHandle}
          onPrimaryInputHandleChange={setApiPrimaryInputHandle}
        />
      ),
      key: "api",
    },
    Platform.OS === "android" && {
      component: <UpdateSection />,
      key: "update",
    },
  ] as const;

  const sections: SectionItem[] = rawSections.filter(isSectionItem);

  const styles = useMemo(
    () => createResponsiveStyles(deviceType, spacing, insets, surfaceColor, borderColor),
    [borderColor, deviceType, insets, spacing, surfaceColor]
  );

  const content = (
    <KeyboardAwareScrollView
      enableOnAndroid
      extraScrollHeight={24}
      keyboardOpeningTime={0}
      keyboardShouldPersistTaps="always"
      style={{ flex: 1, backgroundColor }}
    >
      <ThemedView style={styles.container}>
        {deviceType === "tv" && (
          <View style={styles.header}>
            <ThemedText style={[styles.title, { color: titleColor }]}>{"\u7cfb\u7edf\u8bbe\u7f6e"}</ThemedText>
            <ThemedText style={styles.subtitle}>{"\u6309\u9700\u8c03\u6574\u5e38\u7528\u8bbe\u7f6e\u9879"}</ThemedText>
          </View>
        )}

        <View style={styles.scrollView}>
          {sections.map((item) => (
            <View key={item.key} style={styles.itemWrapper}>
              {item.component}
            </View>
          ))}
        </View>

        <View style={styles.footer}>
          <StyledButton
            text={isLoading ? "保存中..." : "保存设置"}
            onPress={handleSave}
            variant="primary"
            disabled={!hasChanges || isLoading}
            style={[styles.saveButton, (!hasChanges || isLoading) && styles.disabledButton]}
          />
        </View>
      </ThemedView>
    </KeyboardAwareScrollView>
  );

  if (deviceType === "tv") {
    return content;
  }

  return (
    <ResponsiveNavigation>
      <ResponsiveHeader title="设置" showBackButton />
      {content}
    </ResponsiveNavigation>
  );
}

const createResponsiveStyles = (
  deviceType: string,
  spacing: number,
  insets: { top: number },
  surfaceColor: string,
  borderColor: string
) => {
  const isMobile = deviceType === "mobile";
  const isTablet = deviceType === "tablet";
  const isTV = deviceType === "tv";
  const minTouchTarget = DeviceUtils.getMinTouchTargetSize();

  return StyleSheet.create({
    container: {
      flex: 1,
      padding: spacing,
      paddingTop: isTV ? spacing * 1.8 : isMobile ? insets.top + spacing : insets.top + spacing * 1.4,
      borderRadius: isTV ? 0 : 28,
      backgroundColor: surfaceColor,
      margin: isTV ? 0 : spacing,
      borderWidth: isTV ? 0 : 1,
      borderColor,
    },
    header: {
      marginBottom: spacing,
      paddingTop: 4,
      paddingBottom: spacing * 0.6,
      borderBottomWidth: 1,
      borderBottomColor: borderColor,
    },
    title: {
      fontSize: isMobile ? 24 : isTablet ? 28 : 34,
      lineHeight: isMobile ? 32 : isTablet ? 38 : 44,
      fontWeight: "700",
      letterSpacing: 0.3,
      includeFontPadding: false,
      textAlignVertical: "center",
    },
    subtitle: {
      marginTop: 6,
      fontSize: 13,
      lineHeight: 18,
      opacity: 0.72,
    },
    scrollView: {
      flex: 1,
    },
    footer: {
      paddingTop: spacing,
      alignItems: isMobile ? "stretch" : "flex-end",
    },
    saveButton: {
      minHeight: Math.max(52, minTouchTarget),
      width: isMobile ? "100%" : 220,
      maxWidth: isMobile ? 320 : undefined,
    },
    disabledButton: {
      opacity: 0.5,
    },
    itemWrapper: {
      marginBottom: spacing,
    },
  });
};
