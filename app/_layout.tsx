import { DarkTheme, DefaultTheme, ThemeProvider } from "@react-navigation/native";
import { useFonts } from "expo-font";
import { Stack } from "expo-router";
import * as SplashScreen from "expo-splash-screen";
import { useEffect, useMemo, useRef, useState } from "react";
import { Platform, StyleSheet, View } from "react-native";
import Toast, { BaseToast, ErrorToast, ToastConfig } from "react-native-toast-message";
import { SafeAreaProvider } from "react-native-safe-area-context";
import LoginModal from "@/components/LoginModal";
import { UpdateModal } from "@/components/UpdateModal";
import { getThemeColors } from "@/constants/AppThemes";
import { UPDATE_CONFIG } from "@/constants/UpdateConfig";
import { useResponsiveLayout } from "@/hooks/useResponsiveLayout";
import { api } from "@/services/api";
import { useRemoteControlStore } from "@/stores/remoteControlStore";
import { useSettingsStore } from "@/stores/settingsStore";
import useAuthStore from "@/stores/authStore";
import { initUpdateStore, useUpdateStore } from "@/stores/updateStore";
import Logger from "@/utils/Logger";

const logger = Logger.withTag("RootLayout");

SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
  const themePreset = useSettingsStore((state) => state.themePreset);
  const themeMode = useSettingsStore((state) => state.themeMode);

  const [loaded, error] = useFonts({
    SpaceMono: require("../assets/fonts/SpaceMono-Regular.ttf"),
  });

  const { loadSettings, remoteInputEnabled, apiBaseUrl, cronPassword } = useSettingsStore();
  const { startServer, stopServer } = useRemoteControlStore();
  const { checkLoginStatus } = useAuthStore();
  const { checkForUpdate, lastCheckTime } = useUpdateStore();
  const responsiveConfig = useResponsiveLayout();

  const hasTriggeredCronRef = useRef(false);
  const [isSettingsReady, setIsSettingsReady] = useState(false);

  const themeColors = getThemeColors(themePreset, themeMode);

  const toastConfig = useMemo<ToastConfig>(
    () => ({
      success: (props) => (
        <BaseToast
          {...props}
          style={[
            styles.toastBase,
            {
              backgroundColor: themeColors.surface,
              borderColor: themeColors.success,
            },
          ]}
          contentContainerStyle={styles.toastContent}
          text1Style={[styles.toastTitle, { color: themeColors.text }]}
          text2Style={[styles.toastMessage, { color: themeColors.icon }]}
        />
      ),
      info: (props) => (
        <BaseToast
          {...props}
          style={[
            styles.toastBase,
            {
              backgroundColor: themeColors.surface,
              borderColor: themeColors.secondary,
            },
          ]}
          contentContainerStyle={styles.toastContent}
          text1Style={[styles.toastTitle, { color: themeColors.text }]}
          text2Style={[styles.toastMessage, { color: themeColors.icon }]}
        />
      ),
      error: (props) => (
        <ErrorToast
          {...props}
          style={[
            styles.toastBase,
            {
              backgroundColor: themeColors.surface,
              borderColor: themeColors.error,
            },
          ]}
          contentContainerStyle={styles.toastContent}
          text1Style={[styles.toastTitle, { color: themeColors.text }]}
          text2Style={[styles.toastMessage, { color: themeColors.icon }]}
        />
      ),
    }),
    [themeColors]
  );

  useEffect(() => {
    const initializeApp = async () => {
      await loadSettings();
      setIsSettingsReady(true);
    };

    initializeApp();
    initUpdateStore();
  }, [loadSettings]);

  useEffect(() => {
    if (isSettingsReady && apiBaseUrl) {
      checkLoginStatus(apiBaseUrl);
    }
  }, [apiBaseUrl, checkLoginStatus, isSettingsReady]);

  useEffect(() => {
    if (!isSettingsReady || !apiBaseUrl || !cronPassword || hasTriggeredCronRef.current) {
      return;
    }

    hasTriggeredCronRef.current = true;
    api.triggerCron(cronPassword).catch((requestError) => {
      logger.warn(`Startup cron refresh skipped: ${requestError}`);
    });
  }, [apiBaseUrl, cronPassword, isSettingsReady]);

  useEffect(() => {
    if (loaded || error) {
      SplashScreen.hideAsync();
      if (error) {
        logger.warn(`Error in loading fonts: ${error}`);
      }
    }
  }, [loaded, error]);

  useEffect(() => {
    if (loaded && UPDATE_CONFIG.AUTO_CHECK && Platform.OS === "android") {
      const shouldCheck = Date.now() - lastCheckTime > UPDATE_CONFIG.CHECK_INTERVAL;
      if (shouldCheck) {
        checkForUpdate(true);
      }
    }
  }, [loaded, lastCheckTime, checkForUpdate]);

  useEffect(() => {
    if (remoteInputEnabled && responsiveConfig.deviceType !== "mobile") {
      startServer();
    } else {
      stopServer();
    }
  }, [remoteInputEnabled, startServer, stopServer, responsiveConfig.deviceType]);

  if (!loaded && !error) {
    return null;
  }

  return (
    <SafeAreaProvider>
      <ThemeProvider value={themeMode === "dark" ? DarkTheme : DefaultTheme}>
        <View style={styles.container}>
          <Stack>
            <Stack.Screen name="index" options={{ headerShown: false }} />
            <Stack.Screen name="detail" options={{ headerShown: false }} />
            {Platform.OS !== "web" && <Stack.Screen name="play" options={{ headerShown: false }} />}
            <Stack.Screen name="search" options={{ headerShown: false }} />
            <Stack.Screen name="live" options={{ headerShown: false }} />
            <Stack.Screen name="settings" options={{ headerShown: false }} />
            <Stack.Screen name="favorites" options={{ headerShown: false }} />
            <Stack.Screen name="+not-found" />
          </Stack>
        </View>

        <Toast config={toastConfig} topOffset={56} visibilityTime={2400} />
        <LoginModal />
        <UpdateModal />
      </ThemeProvider>
    </SafeAreaProvider>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  toastBase: {
    borderLeftWidth: 0,
    borderWidth: 1,
    borderRadius: 18,
    minHeight: 64,
    width: "92%",
    shadowOpacity: 0.2,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 4 },
    elevation: 4,
  },
  toastContent: {
    paddingHorizontal: 14,
  },
  toastTitle: {
    fontSize: 15,
    fontWeight: "700",
    lineHeight: 20,
  },
  toastMessage: {
    fontSize: 13,
    lineHeight: 18,
  },
});
