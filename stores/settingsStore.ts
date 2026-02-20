import { create } from "zustand";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { api, ServerConfig } from "@/services/api";
import { SettingsManager } from "@/services/storage";
import { storageConfig } from "@/services/storageConfig";
import {
  DEFAULT_THEME_MODE,
  DEFAULT_THEME_PRESET,
  ThemeMode,
  ThemePresetKey,
} from "@/constants/AppThemes";
import Logger from "@/utils/Logger";

const logger = Logger.withTag("SettingsStore");
const DEFAULT_CRON_PASSWORD = "cron_secure_password";

interface SettingsState {
  apiBaseUrl: string;
  cronPassword: string;
  m3uUrl: string;
  remoteInputEnabled: boolean;
  liveAdBlockEnabled: boolean;
  vodAdBlockEnabled: boolean;
  themePreset: ThemePresetKey;
  themeMode: ThemeMode;
  videoSource: {
    enabledAll: boolean;
    sources: {
      [key: string]: boolean;
    };
  };
  isModalVisible: boolean;
  serverConfig: ServerConfig | null;
  isLoadingServerConfig: boolean;
  loadSettings: () => Promise<void>;
  fetchServerConfig: () => Promise<void>;
  setApiBaseUrl: (url: string) => void;
  setCronPassword: (password: string) => void;
  setM3uUrl: (url: string) => void;
  setRemoteInputEnabled: (enabled: boolean) => void;
  setLiveAdBlockEnabled: (enabled: boolean) => void;
  setVodAdBlockEnabled: (enabled: boolean) => void;
  setThemePreset: (preset: ThemePresetKey) => void;
  setThemeMode: (mode: ThemeMode) => void;
  saveSettings: () => Promise<void>;
  setVideoSource: (config: { enabledAll: boolean; sources: { [key: string]: boolean } }) => void;
  showModal: () => void;
  hideModal: () => void;
}

export const useSettingsStore = create<SettingsState>((set, get) => ({
  apiBaseUrl: "",
  cronPassword: DEFAULT_CRON_PASSWORD,
  m3uUrl: "",
  remoteInputEnabled: false,
  liveAdBlockEnabled: true,
  vodAdBlockEnabled: true,
  themePreset: DEFAULT_THEME_PRESET,
  themeMode: DEFAULT_THEME_MODE,
  isModalVisible: false,
  serverConfig: null,
  isLoadingServerConfig: false,
  videoSource: {
    enabledAll: true,
    sources: {},
  },
  loadSettings: async () => {
    const settings = await SettingsManager.get();
    set({
      apiBaseUrl: settings.apiBaseUrl,
      cronPassword: settings.cronPassword || DEFAULT_CRON_PASSWORD,
      m3uUrl: settings.m3uUrl,
      remoteInputEnabled: settings.remoteInputEnabled || false,
      liveAdBlockEnabled: settings.liveAdBlockEnabled ?? true,
      vodAdBlockEnabled: settings.vodAdBlockEnabled ?? true,
      themePreset: settings.themePreset ?? DEFAULT_THEME_PRESET,
      themeMode: settings.themeMode ?? DEFAULT_THEME_MODE,
      videoSource: settings.videoSource || {
        enabledAll: true,
        sources: {},
      },
    });
    if (settings.apiBaseUrl) {
      api.setBaseUrl(settings.apiBaseUrl);
      await get().fetchServerConfig();
    }
  },
  fetchServerConfig: async () => {
    set({ isLoadingServerConfig: true });
    try {
      const config = await api.getServerConfig();
      if (config) {
        storageConfig.setStorageType(config.StorageType);
        set({ serverConfig: config });
      }
    } catch (error) {
      set({ serverConfig: null });
      logger.error("Failed to fetch server config:", error);
    } finally {
      set({ isLoadingServerConfig: false });
    }
  },
  setApiBaseUrl: (url) => set({ apiBaseUrl: url }),
  setCronPassword: (password) => set({ cronPassword: password }),
  setM3uUrl: (url) => set({ m3uUrl: url }),
  setRemoteInputEnabled: (enabled) => set({ remoteInputEnabled: enabled }),
  setLiveAdBlockEnabled: (enabled) => set({ liveAdBlockEnabled: enabled }),
  setVodAdBlockEnabled: (enabled) => set({ vodAdBlockEnabled: enabled }),
  setThemePreset: (preset) => set({ themePreset: preset }),
  setThemeMode: (mode) => set({ themeMode: mode }),
  setVideoSource: (config) => set({ videoSource: config }),
  saveSettings: async () => {
    const {
      apiBaseUrl,
      cronPassword,
      m3uUrl,
      remoteInputEnabled,
      liveAdBlockEnabled,
      vodAdBlockEnabled,
      themePreset,
      themeMode,
      videoSource,
    } = get();

    const currentSettings = await SettingsManager.get();
    const currentApiBaseUrl = currentSettings.apiBaseUrl;
    let processedApiBaseUrl = apiBaseUrl.trim();
    if (processedApiBaseUrl.endsWith("/")) {
      processedApiBaseUrl = processedApiBaseUrl.slice(0, -1);
    }

    if (!/^https?:\/\//i.test(processedApiBaseUrl)) {
      const hostPart = processedApiBaseUrl.split("/")[0];
      const isIpAddress = /^((\d{1,3}\.){3}\d{1,3})(:\d+)?$/.test(hostPart);
      const hasPort = /:\d+/.test(hostPart);

      if (isIpAddress || hasPort) {
        processedApiBaseUrl = "http://" + processedApiBaseUrl;
      } else {
        processedApiBaseUrl = "https://" + processedApiBaseUrl;
      }
    }

    await SettingsManager.save({
      apiBaseUrl: processedApiBaseUrl,
      cronPassword: cronPassword.trim(),
      m3uUrl,
      remoteInputEnabled,
      liveAdBlockEnabled,
      vodAdBlockEnabled,
      themePreset,
      themeMode,
      videoSource,
    });

    if (currentApiBaseUrl !== processedApiBaseUrl) {
      await AsyncStorage.setItem("authCookies", "");
    }

    api.setBaseUrl(processedApiBaseUrl);
    set({ isModalVisible: false, apiBaseUrl: processedApiBaseUrl });
    await get().fetchServerConfig();
  },
  showModal: () => set({ isModalVisible: true }),
  hideModal: () => set({ isModalVisible: false }),
}));
