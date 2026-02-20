import React, { useCallback, useEffect, useRef, useState } from "react";
import {
  Animated,
  BackHandler,
  FlatList,
  Platform,
  Pressable,
  StatusBar,
  StyleSheet,
  ToastAndroid,
  View,
  findNodeHandle,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useFocusEffect, useRouter } from "expo-router";
import { Heart, LogOut, Search, Settings } from "lucide-react-native";

import VideoCard from "@/components/VideoCard";
import VideoLoadingAnimation from "@/components/VideoLoadingAnimation";
import { StyledButton } from "@/components/StyledButton";
import CustomScrollView from "@/components/CustomScrollView";
import ResponsiveNavigation from "@/components/navigation/ResponsiveNavigation";
import { ThemedText } from "@/components/ThemedText";
import { ThemedView } from "@/components/ThemedView";
import { useApiConfig, getApiConfigErrorMessage } from "@/hooks/useApiConfig";
import { useResponsiveLayout } from "@/hooks/useResponsiveLayout";
import { useThemeColor } from "@/hooks/useThemeColor";
import { api } from "@/services/api";
import useAuthStore from "@/stores/authStore";
import useHomeStore, { Category, RowItem } from "@/stores/homeStore";
import { useSettingsStore } from "@/stores/settingsStore";
import { getCommonResponsiveStyles } from "@/utils/ResponsiveStyles";

const LOAD_MORE_THRESHOLD = 200;

export default function HomeScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const backPressTimeRef = useRef<number | null>(null);

  const favoriteButtonRef = useRef<View>(null);
  const searchButtonRef = useRef<View>(null);
  const settingsButtonRef = useRef<View>(null);
  const logoutButtonRef = useRef<View>(null);
  const firstTagButtonRef = useRef<View>(null);
  const firstContentCardRef = useRef<View>(null);

  const [selectedTag, setSelectedTag] = useState<string | null>(null);
  const [topRightButtonHandle, setTopRightButtonHandle] = useState<number | undefined>(undefined);
  const [firstTagButtonHandle, setFirstTagButtonHandle] = useState<number | undefined>(undefined);
  const [firstContentCardHandle, setFirstContentCardHandle] = useState<number | undefined>(undefined);

  const themeMode = useSettingsStore((state) => state.themeMode);
  const iconColor = useThemeColor({}, "text");
  const mutedIconColor = useThemeColor({}, "icon");
  const linkColor = useThemeColor({}, "link");

  const responsiveConfig = useResponsiveLayout();
  const commonStyles = getCommonResponsiveStyles(responsiveConfig);
  const { deviceType, spacing, columns } = responsiveConfig;

  const {
    categories,
    selectedCategory,
    contentData,
    loading,
    loadingMore,
    error,
    fetchInitialData,
    loadMoreData,
    selectCategory,
    refreshPlayRecords,
    clearError,
  } = useHomeStore();
  const { isLoggedIn, logout } = useAuthStore();
  const apiConfigStatus = useApiConfig();

  useEffect(() => {
    const preferredTarget = isLoggedIn ? logoutButtonRef.current : settingsButtonRef.current;
    const fallbackTarget = settingsButtonRef.current || searchButtonRef.current || favoriteButtonRef.current;
    const handle = findNodeHandle(preferredTarget || fallbackTarget) || undefined;
    setTopRightButtonHandle(handle);
  }, [isLoggedIn]);

  useEffect(() => {
    const tagHandle = findNodeHandle(firstTagButtonRef.current) || undefined;
    setFirstTagButtonHandle(tagHandle);
  }, [selectedCategory?.title, selectedCategory?.tag, selectedCategory?.tags?.length]);

  useEffect(() => {
    const cardHandle = findNodeHandle(firstContentCardRef.current) || undefined;
    setFirstContentCardHandle(cardHandle);
  }, [contentData.length, selectedCategory?.title, selectedCategory?.tag]);

  useFocusEffect(
    useCallback(() => {
      refreshPlayRecords();
    }, [refreshPlayRecords])
  );

  useFocusEffect(
    useCallback(() => {
      const handleBackPress = () => {
        const now = Date.now();

        if (!backPressTimeRef.current || now - backPressTimeRef.current > 2000) {
          backPressTimeRef.current = now;
          ToastAndroid.show("再按一次返回键退出", ToastAndroid.SHORT);
          return true;
        }

        BackHandler.exitApp();
        return true;
      };

      if (Platform.OS === "android") {
        const backHandler = BackHandler.addEventListener("hardwareBackPress", handleBackPress);
        return () => {
          backHandler.remove();
          backPressTimeRef.current = null;
        };
      }

      return undefined;
    }, [])
  );

  useEffect(() => {
    if (!selectedCategory) return;

    if (selectedCategory.tags && !selectedCategory.tag) {
      const defaultTag = selectedCategory.tags[0];
      setSelectedTag(defaultTag);
      selectCategory({ ...selectedCategory, tag: defaultTag });
      return;
    }

    if (apiConfigStatus.isConfigured && !apiConfigStatus.needsConfiguration) {
      if (selectedCategory.tags && selectedCategory.tag) {
        fetchInitialData();
      } else if (!selectedCategory.tags) {
        fetchInitialData();
      }
    }
  }, [
    selectedCategory,
    selectedCategory?.tag,
    apiConfigStatus.isConfigured,
    apiConfigStatus.needsConfiguration,
    fetchInitialData,
    selectCategory,
  ]);

  useEffect(() => {
    if (apiConfigStatus.needsConfiguration && error) {
      clearError();
    }
  }, [apiConfigStatus.needsConfiguration, error, clearError]);

  useEffect(() => {
    if (!loading && contentData.length > 0) {
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 300,
        useNativeDriver: true,
      }).start();
    } else if (loading) {
      fadeAnim.setValue(0);
    }
  }, [loading, contentData.length, fadeAnim]);

  const handleCategorySelect = (category: Category) => {
    setSelectedTag(null);
    selectCategory(category);
  };

  const handleTagSelect = (tag: string) => {
    setSelectedTag(tag);
    if (selectedCategory) {
      selectCategory({ ...selectedCategory, tag });
    }
  };

  const renderCategory = ({ item }: { item: Category }) => {
    const isSelected = selectedCategory?.title === item.title;
    const nextFocusDownTarget =
      deviceType === "tv"
        ? selectedCategory?.tags
          ? firstTagButtonHandle
          : firstContentCardHandle
        : undefined;

    return (
      <StyledButton
        text={item.title}
        onPress={() => handleCategorySelect(item)}
        isSelected={isSelected}
        style={dynamicStyles.categoryButton}
        textStyle={dynamicStyles.categoryText}
        nextFocusDown={nextFocusDownTarget}
      />
    );
  };

  const renderTagItem = ({ item, index }: { item: string; index: number }) => {
    const isSelected = selectedTag === item;

    return (
      <StyledButton
        ref={index === 0 ? firstTagButtonRef : undefined}
        hasTVPreferredFocus={deviceType === "tv" && index === 0}
        text={item}
        onPress={() => handleTagSelect(item)}
        isSelected={isSelected}
        style={deviceType === "tv" ? dynamicStyles.tagSidebarButton : dynamicStyles.categoryButton}
        textStyle={deviceType === "tv" ? dynamicStyles.tagSidebarText : dynamicStyles.categoryText}
        variant="ghost"
        nextFocusRight={deviceType === "tv" ? firstContentCardHandle : undefined}
      />
    );
  };

  const renderContentItem = ({ item, index }: { item: RowItem; index: number }) => {
    const isTvFirstColumn = deviceType === "tv" && selectedCategory?.tags && index % columns === 0;

    return (
      <VideoCard
        ref={index === 0 ? firstContentCardRef : undefined}
        id={item.id}
        source={item.source}
        title={item.title}
        poster={item.poster}
        year={item.year}
        rate={item.rate}
        progress={item.progress}
        playTime={item.play_time}
        episodeIndex={item.episodeIndex}
        sourceName={item.sourceName}
        totalEpisodes={item.totalEpisodes}
        api={api}
        onRecordDeleted={fetchInitialData}
        nextFocusUp={topRightButtonHandle}
        nextFocusLeft={isTvFirstColumn ? firstTagButtonHandle : undefined}
      />
    );
  };

  const renderFooter = () => {
    if (!loadingMore) return null;
    return <VideoLoadingAnimation size="compact" showLabel={false} />;
  };

  const shouldShowApiConfig = apiConfigStatus.needsConfiguration && selectedCategory && !selectedCategory.tags;

  const renderHeader = () => {
    if (deviceType === "mobile") {
      return null;
    }

    return (
      <View style={dynamicStyles.headerContainer}>
        <View style={dynamicStyles.headerLeft}>
          <ThemedText style={dynamicStyles.headerTitle}>首页</ThemedText>
          <Pressable
            android_ripple={Platform.isTV || deviceType !== "tv" ? { color: "transparent" } : { color: linkColor }}
            style={dynamicStyles.liveEntry}
            onPress={() => router.push("/live")}
          >
            {({ focused }) => <ThemedText style={[dynamicStyles.headerTitle, { color: focused ? linkColor : mutedIconColor }]}>直播</ThemedText>}
          </Pressable>
        </View>

        <View style={dynamicStyles.rightHeaderButtons}>
          <StyledButton ref={favoriteButtonRef} style={dynamicStyles.iconButton} onPress={() => router.push("/favorites")} variant="ghost">
            <Heart color={iconColor} size={24} />
          </StyledButton>

          <StyledButton ref={searchButtonRef} style={dynamicStyles.iconButton} onPress={() => router.push({ pathname: "/search" })} variant="ghost">
            <Search color={iconColor} size={24} />
          </StyledButton>

          <StyledButton ref={settingsButtonRef} style={dynamicStyles.iconButton} onPress={() => router.push("/settings")} variant="ghost">
            <Settings color={iconColor} size={24} />
          </StyledButton>

          {isLoggedIn && (
            <StyledButton ref={logoutButtonRef} style={dynamicStyles.iconButton} onPress={logout} variant="ghost">
              <LogOut color={iconColor} size={24} />
            </StyledButton>
          )}
        </View>
      </View>
    );
  };

  const renderContentPanel = () => {
    if (shouldShowApiConfig) {
      return (
        <View style={commonStyles.center}>
          <ThemedText type="subtitle" style={{ padding: spacing, textAlign: "center" }}>
            {getApiConfigErrorMessage(apiConfigStatus)}
          </ThemedText>
        </View>
      );
    }

    if (apiConfigStatus.isValidating) {
      return (
        <View style={commonStyles.center}>
          <VideoLoadingAnimation />
          <ThemedText type="subtitle" style={{ padding: spacing, textAlign: "center" }}>
            正在验证服务配置...
          </ThemedText>
        </View>
      );
    }

    if (apiConfigStatus.error && !apiConfigStatus.isValid) {
      return (
        <View style={commonStyles.center}>
          <ThemedText type="subtitle" style={{ padding: spacing, textAlign: "center" }}>
            {apiConfigStatus.error}
          </ThemedText>
        </View>
      );
    }

    if (loading) {
      return (
        <View style={commonStyles.center}>
          <VideoLoadingAnimation />
        </View>
      );
    }

    if (error) {
      return (
        <View style={commonStyles.center}>
          <ThemedText type="subtitle" style={{ padding: spacing }}>
            {error}
          </ThemedText>
        </View>
      );
    }

    return (
      <Animated.View style={[dynamicStyles.contentContainer, { opacity: fadeAnim }]}>
        <CustomScrollView
          data={contentData}
          renderItem={renderContentItem}
          loading={loading}
          loadingMore={loadingMore}
          error={error}
          onEndReached={loadMoreData}
          loadMoreThreshold={LOAD_MORE_THRESHOLD}
          emptyMessage={selectedCategory?.tags ? "请选择一个子分类" : "该分类下暂无内容"}
          ListFooterComponent={renderFooter}
          enableTvBackToTop={deviceType === "tv"}
        />
      </Animated.View>
    );
  };

  const dynamicStyles = StyleSheet.create({
    container: {
      flex: 1,
      paddingTop: deviceType === "mobile" ? insets.top : deviceType === "tablet" ? insets.top + 20 : 40,
    },
    headerContainer: {
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "center",
      paddingHorizontal: spacing * 1.5,
      marginBottom: spacing,
    },
    headerLeft: {
      flexDirection: "row",
      alignItems: "center",
    },
    liveEntry: {
      marginLeft: 20,
    },
    headerTitle: {
      fontSize: deviceType === "mobile" ? 24 : deviceType === "tablet" ? 28 : 32,
      fontWeight: "700",
      paddingTop: 16,
    },
    rightHeaderButtons: {
      flexDirection: "row",
      alignItems: "center",
    },
    iconButton: {
      borderRadius: 30,
      marginLeft: spacing / 2,
    },
    categoryContainer: {
      paddingBottom: spacing / 2,
    },
    categoryListContent: {
      paddingHorizontal: spacing,
    },
    categoryButton: {
      paddingHorizontal: deviceType === "tv" ? spacing / 3 : spacing / 2,
      paddingVertical: spacing / 2,
      borderRadius: deviceType === "mobile" ? 6 : 8,
      marginHorizontal: deviceType === "tv" ? spacing / 4 : spacing / 2,
    },
    categoryText: {
      fontSize: deviceType === "mobile" ? 14 : 16,
      fontWeight: "500",
    },
    tvBodyRow: {
      flex: 1,
      flexDirection: "row",
      paddingHorizontal: spacing,
      gap: spacing,
    },
    tagSidebar: {
      flexBasis: "16.6%",
      minWidth: 180,
      maxWidth: 280,
      paddingRight: spacing / 2,
      paddingBottom: spacing,
    },
    tagSidebarContent: {
      paddingBottom: spacing * 2,
      gap: spacing / 2,
    },
    tagSidebarButton: {
      width: "100%",
      minHeight: 58,
      justifyContent: "flex-start",
      paddingHorizontal: spacing * 0.75,
      marginVertical: spacing / 4,
    },
    tagSidebarText: {
      textAlign: "left",
      fontSize: 16,
      fontWeight: "600",
    },
    tvContentPane: {
      flex: 1,
      minWidth: 0,
    },
    contentContainer: {
      flex: 1,
    },
  });

  const isTvSplitLayout = deviceType === "tv" && Boolean(selectedCategory?.tags?.length);

  const content = (
    <ThemedView style={[commonStyles.container, dynamicStyles.container]}>
      {deviceType === "mobile" && <StatusBar barStyle={themeMode === "dark" ? "light-content" : "dark-content"} />}

      {renderHeader()}

      <View style={dynamicStyles.categoryContainer}>
        <FlatList
          data={categories}
          renderItem={renderCategory}
          keyExtractor={(item) => item.title}
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={dynamicStyles.categoryListContent}
        />
      </View>

      {isTvSplitLayout ? (
        <View style={dynamicStyles.tvBodyRow}>
          <View style={dynamicStyles.tagSidebar}>
            <FlatList
              data={selectedCategory?.tags ?? []}
              renderItem={renderTagItem}
              keyExtractor={(item) => item}
              showsVerticalScrollIndicator={false}
              contentContainerStyle={dynamicStyles.tagSidebarContent}
            />
          </View>

          <View style={dynamicStyles.tvContentPane}>{renderContentPanel()}</View>
        </View>
      ) : (
        <>
          {selectedCategory?.tags && (
            <View style={dynamicStyles.categoryContainer}>
              <FlatList
                data={selectedCategory.tags}
                renderItem={renderTagItem}
                keyExtractor={(item) => item}
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={dynamicStyles.categoryListContent}
              />
            </View>
          )}
          {renderContentPanel()}
        </>
      )}
    </ThemedView>
  );

  if (deviceType === "tv") {
    return content;
  }

  return <ResponsiveNavigation>{content}</ResponsiveNavigation>;
}
