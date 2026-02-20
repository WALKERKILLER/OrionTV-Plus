import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Alert, Keyboard, StyleSheet, TextInput, TouchableOpacity, View } from "react-native";
import { useRouter } from "expo-router";
import { QrCode, Search } from "lucide-react-native";
import { RemoteControlModal } from "@/components/RemoteControlModal";
import { StyledButton } from "@/components/StyledButton";
import { ThemedText } from "@/components/ThemedText";
import { ThemedView } from "@/components/ThemedView";
import VideoCard from "@/components/VideoCard";
import VideoLoadingAnimation from "@/components/VideoLoadingAnimation";
import ResponsiveHeader from "@/components/navigation/ResponsiveHeader";
import ResponsiveNavigation from "@/components/navigation/ResponsiveNavigation";
import CustomScrollView from "@/components/CustomScrollView";
import { useResponsiveLayout } from "@/hooks/useResponsiveLayout";
import { useThemeColor } from "@/hooks/useThemeColor";
import { api, SearchResult } from "@/services/api";
import { useRemoteControlStore } from "@/stores/remoteControlStore";
import { useSettingsStore } from "@/stores/settingsStore";
import { DeviceUtils } from "@/utils/DeviceUtils";
import { getCommonResponsiveStyles } from "@/utils/ResponsiveStyles";
import Logger from "@/utils/Logger";

const logger = Logger.withTag("SearchScreen");

export default function SearchScreen() {
  const [keyword, setKeyword] = useState("");
  const [results, setResults] = useState<SearchResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isInputFocused, setIsInputFocused] = useState(false);

  const textInputRef = useRef<TextInput>(null);
  const router = useRouter();

  const { showModal: showRemoteModal, lastMessage, targetPage, clearMessage } = useRemoteControlStore();
  const { remoteInputEnabled } = useSettingsStore();

  const responsiveConfig = useResponsiveLayout();
  const commonStyles = getCommonResponsiveStyles(responsiveConfig);
  const { deviceType, spacing } = responsiveConfig;

  const primaryColor = useThemeColor({}, "primary");
  const onPrimaryColor = useThemeColor({}, "onPrimary");
  const surfaceVariantColor = useThemeColor({}, "surfaceVariant");
  const textColor = useThemeColor({}, "text");
  const mutedColor = useThemeColor({}, "icon");
  const errorColor = useThemeColor({}, "error");

  useEffect(() => {
    if (!lastMessage || targetPage !== "search") {
      return;
    }

    logger.debug("Received remote input:", lastMessage);
    const remoteKeyword = lastMessage.split("_")[0];
    setKeyword(remoteKeyword);
    clearMessage();

    if (remoteKeyword.trim()) {
      void handleSearch(remoteKeyword);
    }
  }, [clearMessage, lastMessage, targetPage]);

  const handleSearch = useCallback(
    async (rawKeyword?: string) => {
      const term = typeof rawKeyword === "string" ? rawKeyword : keyword;
      if (!term.trim()) {
        Keyboard.dismiss();
        return;
      }

      Keyboard.dismiss();
      setLoading(true);
      setError(null);

      try {
        const response = await api.searchVideos(term.trim());
        setResults(response.results);

        if (response.results.length === 0) {
          setError("没有找到相关内容");
        }
      } catch (requestError) {
        setError("搜索失败，请稍后重试。");
        logger.info("Search failed:", requestError);
      } finally {
        setLoading(false);
      }
    },
    [keyword]
  );

  const onSearchPress = useCallback(() => {
    void handleSearch();
  }, [handleSearch]);

  const handleQrPress = useCallback(() => {
    if (!remoteInputEnabled) {
      Alert.alert("远程输入未启用", "请先在设置页面中启用远程输入功能", [
        { text: "取消", style: "cancel" },
        { text: "去设置", onPress: () => router.push("/settings") },
      ]);
      return;
    }

    showRemoteModal("search");
  }, [remoteInputEnabled, router, showRemoteModal]);

  const renderItem = useCallback(
    ({ item }: { item: SearchResult; index: number }) => (
      <VideoCard
        id={item.id.toString()}
        source={item.source}
        title={item.title}
        poster={item.poster}
        year={item.year}
        sourceName={item.source_name}
        api={api}
      />
    ),
    []
  );

  const dynamicStyles = useMemo(
    () =>
      createResponsiveStyles(deviceType, spacing, {
        errorColor,
        inputTextColor: textColor,
        mutedColor,
        surfaceVariantColor,
      }),
    [deviceType, errorColor, mutedColor, spacing, surfaceVariantColor, textColor]
  );

  const renderSearchContent = () => (
    <>
      <View style={dynamicStyles.searchContainer}>
        <TouchableOpacity
          activeOpacity={1}
          style={[
            dynamicStyles.inputContainer,
            {
              borderColor: isInputFocused ? primaryColor : "transparent",
            },
          ]}
          onPress={() => textInputRef.current?.focus()}
        >
          <TextInput
            ref={textInputRef}
            style={dynamicStyles.input}
            placeholder="搜索电影、剧集..."
            placeholderTextColor={mutedColor}
            value={keyword}
            onChangeText={setKeyword}
            onSubmitEditing={onSearchPress}
            onFocus={() => setIsInputFocused(true)}
            onBlur={() => setIsInputFocused(false)}
            returnKeyType="search"
          />
        </TouchableOpacity>

        <StyledButton style={dynamicStyles.searchButton} onPress={onSearchPress} variant="primary">
          <Search size={deviceType === "mobile" ? 20 : 24} color={onPrimaryColor} />
        </StyledButton>

        {deviceType !== "mobile" && (
          <StyledButton style={dynamicStyles.qrButton} onPress={handleQrPress} variant="primary">
            <QrCode size={deviceType === "tv" ? 24 : 20} color={onPrimaryColor} />
          </StyledButton>
        )}
      </View>

      {loading ? (
        <VideoLoadingAnimation showProgressBar={false} />
      ) : error ? (
        <View style={[commonStyles.center, { flex: 1 }]}>
          <ThemedText style={dynamicStyles.errorText}>{error}</ThemedText>
        </View>
      ) : (
        <CustomScrollView
          data={results}
          renderItem={renderItem}
          loading={loading}
          error={error}
          emptyMessage="输入关键词开始搜索"
          enableTvBackToTop
        />
      )}

      <RemoteControlModal />
    </>
  );

  const content = <ThemedView style={[commonStyles.container, dynamicStyles.container]}>{renderSearchContent()}</ThemedView>;

  if (deviceType === "tv") {
    return content;
  }

  return (
    <ResponsiveNavigation>
      <ResponsiveHeader title="搜索" showBackButton />
      {content}
    </ResponsiveNavigation>
  );
}

type StyleTokens = {
  errorColor: string;
  inputTextColor: string;
  mutedColor: string;
  surfaceVariantColor: string;
};

const createResponsiveStyles = (deviceType: string, spacing: number, tokens: StyleTokens) => {
  const isMobile = deviceType === "mobile";
  const minTouchTarget = DeviceUtils.getMinTouchTargetSize();

  return StyleSheet.create({
    container: {
      flex: 1,
      paddingTop: deviceType === "tv" ? 50 : 0,
    },
    searchContainer: {
      flexDirection: "row",
      paddingHorizontal: spacing,
      marginBottom: spacing,
      alignItems: "center",
      paddingTop: isMobile ? spacing / 2 : 0,
    },
    inputContainer: {
      flex: 1,
      height: isMobile ? minTouchTarget : 50,
      backgroundColor: tokens.surfaceVariantColor,
      borderRadius: 10,
      marginRight: spacing / 2,
      borderWidth: 2,
      justifyContent: "center",
    },
    input: {
      flex: 1,
      paddingHorizontal: spacing,
      color: tokens.inputTextColor,
      fontSize: isMobile ? 16 : 18,
    },
    searchButton: {
      width: isMobile ? minTouchTarget : 50,
      height: isMobile ? minTouchTarget : 50,
      justifyContent: "center",
      alignItems: "center",
      borderRadius: 10,
      marginRight: deviceType !== "mobile" ? spacing / 2 : 0,
    },
    qrButton: {
      width: isMobile ? minTouchTarget : 50,
      height: isMobile ? minTouchTarget : 50,
      justifyContent: "center",
      alignItems: "center",
      borderRadius: 10,
    },
    errorText: {
      color: tokens.errorColor,
      fontSize: isMobile ? 14 : 16,
      textAlign: "center",
    },
  });
};
