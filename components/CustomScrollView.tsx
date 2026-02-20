import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { BackHandler, FlatList, Platform, StyleSheet, TouchableOpacity, View } from "react-native";
import { ThemedText } from "@/components/ThemedText";
import VideoLoadingAnimation from "@/components/VideoLoadingAnimation";
import { useResponsiveLayout } from "@/hooks/useResponsiveLayout";
import { useThemeColor } from "@/hooks/useThemeColor";
import { getCommonResponsiveStyles } from "@/utils/ResponsiveStyles";

interface CustomScrollViewProps {
  data: any[];
  renderItem: ({ item, index }: { item: any; index: number }) => React.ReactNode;
  numColumns?: number;
  loading?: boolean;
  loadingMore?: boolean;
  error?: string | null;
  onEndReached?: () => void;
  loadMoreThreshold?: number;
  emptyMessage?: string;
  ListFooterComponent?: React.ComponentType<any> | React.ReactElement | null;
  enableTvBackToTop?: boolean;
}

const CustomScrollView: React.FC<CustomScrollViewProps> = ({
  data,
  renderItem,
  numColumns,
  loading = false,
  loadingMore = false,
  error = null,
  onEndReached,
  emptyMessage = "暂无内容",
  ListFooterComponent,
  enableTvBackToTop = false,
}) => {
  const listRef = useRef<FlatList<any>>(null);
  const [showScrollToTop, setShowScrollToTop] = useState(false);

  const responsiveConfig = useResponsiveLayout();
  const commonStyles = getCommonResponsiveStyles(responsiveConfig);
  const { deviceType, spacing, cardWidth, columns } = responsiveConfig;

  const overlayColor = useThemeColor({}, "overlay");
  const onPrimaryColor = useThemeColor({}, "onPrimary");

  const effectiveColumns = numColumns || columns;
  const initialBatchSize = Math.max(effectiveColumns * 3, 10);

  const styles = useMemo(
    () =>
      StyleSheet.create({
        listContent: {
          paddingBottom: spacing * 2.4,
          paddingHorizontal: spacing / 2,
        },
        columnWrapper: {
          marginBottom: spacing,
          justifyContent: "flex-start",
        },
        itemContainer: {
          width: cardWidth,
          marginRight: spacing,
        },
        itemContainerLastColumn: {
          width: cardWidth,
          marginRight: 0,
        },
        scrollToTopButton: {
          position: "absolute",
          right: spacing,
          bottom: spacing * 2,
          backgroundColor: overlayColor,
          paddingHorizontal: spacing * 0.9,
          paddingVertical: spacing * 0.55,
          borderRadius: 12,
          opacity: showScrollToTop ? 1 : 0,
        },
        scrollToTopText: {
          color: onPrimaryColor,
          fontSize: 13,
          fontWeight: "700",
        },
      }),
    [cardWidth, onPrimaryColor, overlayColor, showScrollToTop, spacing]
  );

  const handleEndReached = useCallback(() => {
    if (!loadingMore && onEndReached) {
      onEndReached();
    }
  }, [loadingMore, onEndReached]);

  const handleScroll = useCallback(({ nativeEvent }: { nativeEvent: any }) => {
    setShowScrollToTop(nativeEvent.contentOffset.y > 220);
  }, []);

  const scrollToTop = useCallback(() => {
    listRef.current?.scrollToOffset({ offset: 0, animated: true });
  }, []);

  useEffect(() => {
    if (deviceType !== "tv" || !enableTvBackToTop) {
      return;
    }

    const subscription = BackHandler.addEventListener("hardwareBackPress", () => {
      if (!showScrollToTop) {
        return false;
      }

      scrollToTop();
      return true;
    });

    return () => subscription.remove();
  }, [deviceType, enableTvBackToTop, scrollToTop, showScrollToTop]);

  const renderFooter = useMemo(() => {
    if (ListFooterComponent) {
      if (React.isValidElement(ListFooterComponent)) {
        return ListFooterComponent;
      }
      if (typeof ListFooterComponent === "function") {
        const Footer = ListFooterComponent as React.ComponentType<any>;
        return <Footer />;
      }
      return null;
    }

    if (loadingMore) {
      return <VideoLoadingAnimation size="compact" showLabel={false} />;
    }

    return null;
  }, [ListFooterComponent, loadingMore]);

  const renderGridItem = useCallback(
    ({ item, index }: { item: any; index: number }) => {
      const isLastColumn = (index + 1) % effectiveColumns === 0;

      return <View style={isLastColumn ? styles.itemContainerLastColumn : styles.itemContainer}>{renderItem({ item, index })}</View>;
    },
    [effectiveColumns, renderItem, styles.itemContainer, styles.itemContainerLastColumn]
  );

  const keyExtractor = useCallback((item: any, index: number) => {
    if (item?.id !== undefined && item?.source) {
      return `item-${item.source}-${item.id}-${index}`;
    }

    if (item?.id !== undefined) {
      return `item-${item.id}-${index}`;
    }

    return `item-${index}`;
  }, []);

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
    <View style={{ flex: 1 }}>
      <FlatList
        ref={listRef}
        data={data}
        renderItem={renderGridItem}
        keyExtractor={keyExtractor}
        numColumns={effectiveColumns}
        key={`grid-${effectiveColumns}`}
        columnWrapperStyle={effectiveColumns > 1 ? styles.columnWrapper : undefined}
        contentContainerStyle={styles.listContent}
        onEndReached={handleEndReached}
        onEndReachedThreshold={0.55}
        onScroll={handleScroll}
        scrollEventThrottle={16}
        showsVerticalScrollIndicator={deviceType !== "tv"}
        ListFooterComponent={renderFooter}
        ListEmptyComponent={() => (
          <View style={commonStyles.center}>
            <ThemedText>{emptyMessage}</ThemedText>
          </View>
        )}
        initialNumToRender={initialBatchSize}
        maxToRenderPerBatch={initialBatchSize}
        updateCellsBatchingPeriod={40}
        windowSize={9}
        removeClippedSubviews={Platform.OS === "android"}
      />

      {deviceType !== "tv" && (
        <TouchableOpacity style={styles.scrollToTopButton} onPress={scrollToTop} activeOpacity={0.86}>
          <ThemedText style={styles.scrollToTopText}>{"回到顶部"}</ThemedText>
        </TouchableOpacity>
      )}
    </View>
  );
};

export default CustomScrollView;
