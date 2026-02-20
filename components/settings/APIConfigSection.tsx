import React, { forwardRef, useEffect, useImperativeHandle, useMemo, useRef, useState } from "react";
import { Animated, Pressable, StyleSheet, TextInput, View, findNodeHandle } from "react-native";

import { ThemedText } from "@/components/ThemedText";
import { useButtonAnimation } from "@/hooks/useAnimation";
import { useThemeColor } from "@/hooks/useThemeColor";
import { useRemoteControlStore } from "@/stores/remoteControlStore";
import { useSettingsStore } from "@/stores/settingsStore";

import { SettingsSection } from "./SettingsSection";

interface APIConfigSectionProps {
  onChanged: () => void;
  onFocus?: () => void;
  onBlur?: () => void;
  onPress?: () => void;
  hideDescription?: boolean;
  nextFocusUp?: number;
  onPrimaryInputHandleChange?: (handle: number | undefined) => void;
}

export interface APIConfigSectionRef {
  setInputValue: (value: string) => void;
}

export const APIConfigSection = forwardRef<APIConfigSectionRef, APIConfigSectionProps>(
  ({ onChanged, onFocus, onBlur, onPress, hideDescription = false, nextFocusUp, onPrimaryInputHandleChange }, ref) => {
    const { apiBaseUrl, cronPassword, setApiBaseUrl, setCronPassword, remoteInputEnabled } = useSettingsStore();
    const { serverUrl } = useRemoteControlStore();

    const [focusedInputKey, setFocusedInputKey] = useState<"api" | "cron" | null>(null);
    const [isSectionFocused, setIsSectionFocused] = useState(false);
    const [selection, setSelection] = useState<{ start: number; end: number }>({ start: 0, end: 0 });
    const [primaryInputHandle, setPrimaryInputHandle] = useState<number | undefined>(undefined);
    const [secondaryInputHandle, setSecondaryInputHandle] = useState<number | undefined>(undefined);
    const [entryHandle, setEntryHandle] = useState<number | undefined>(undefined);

    const entryRef = useRef<View>(null);
    const inputRef = useRef<TextInput>(null);
    const cronInputRef = useRef<TextInput>(null);
    const inputAnimationStyle = useButtonAnimation(isSectionFocused, 1.01);

    const surfaceVariant = useThemeColor({}, "surfaceVariant");
    const textColor = useThemeColor({}, "text");
    const mutedColor = useThemeColor({}, "icon");
    const outlineColor = useThemeColor({}, "outlineVariant");
    const focusRingColor = useThemeColor({}, "focusRing");

    const styles = useMemo(
      () =>
        StyleSheet.create({
          sectionEntry: {
            width: "100%",
          },
          inputContainer: {
            marginBottom: 8,
          },
          titleContainer: {
            flexDirection: "row",
            alignItems: "center",
            marginBottom: 10,
          },
          sectionTitle: {
            fontSize: 16,
            lineHeight: 22,
            fontWeight: "700",
            marginRight: 12,
          },
          subtitle: {
            fontSize: 12,
            lineHeight: 16,
            color: mutedColor,
          },
          input: {
            minHeight: 50,
            borderWidth: 1,
            borderRadius: 16,
            paddingHorizontal: 14,
            fontSize: 15,
            backgroundColor: surfaceVariant,
            color: textColor,
            borderColor: outlineColor,
          },
          inputFocused: {
            borderColor: focusRingColor,
            shadowColor: focusRingColor,
            shadowOffset: { width: 0, height: 0 },
            shadowOpacity: 0.35,
            shadowRadius: 9,
            elevation: 4,
          },
          secondaryInput: {
            marginTop: 10,
          },
        }),
      [focusRingColor, mutedColor, outlineColor, surfaceVariant, textColor]
    );

    const handleUrlChange = (url: string) => {
      setApiBaseUrl(url);
      onChanged();
    };

    const handleCronPasswordChange = (value: string) => {
      setCronPassword(value);
      onChanged();
    };

    useImperativeHandle(ref, () => ({
      setInputValue: (value: string) => {
        setApiBaseUrl(value);
        onChanged();
      },
    }));

    useEffect(() => {
      onPrimaryInputHandleChange?.(entryHandle);
    }, [entryHandle, onPrimaryInputHandleChange]);

    useEffect(() => {
      const timer = setTimeout(() => {
        const handle = findNodeHandle(entryRef.current) || undefined;
        setEntryHandle(handle);
      }, 0);

      return () => clearTimeout(timer);
    }, []);


    const handleInputFocus = (value: string, inputKey: "api" | "cron") => {
      setFocusedInputKey(inputKey);
      setIsSectionFocused(true);
      onFocus?.();

      const end = value.length;
      setSelection({ start: end, end });
    };

    const handleInputBlur = () => {
      setFocusedInputKey(null);
      setIsSectionFocused(false);
      onBlur?.();
    };

    const handlePress = () => {
      inputRef.current?.focus();
      onPress?.();
    };

    const handleEntryFocus = () => {
      setIsSectionFocused(true);
      onFocus?.();
      requestAnimationFrame(() => {
        inputRef.current?.focus();
      });
    };

    return (
      <SettingsSection focusable={false}>
        <Pressable
          ref={entryRef}
          focusable
          style={styles.sectionEntry}
          onFocus={handleEntryFocus}
          onBlur={() => {
            if (!focusedInputKey) {
              setIsSectionFocused(false);
              onBlur?.();
            }
          }}
          onPress={handlePress}
          onLayout={() => {
            const handle = findNodeHandle(entryRef.current) || undefined;
            setEntryHandle(handle);
          }}
          nextFocusUp={nextFocusUp}
        >
          <View style={styles.inputContainer}>
            <View style={styles.titleContainer}>
              <ThemedText style={styles.sectionTitle}>接口地址</ThemedText>
              {!hideDescription && remoteInputEnabled && serverUrl ? (
                <ThemedText style={styles.subtitle}>远程输入地址：{serverUrl}</ThemedText>
              ) : null}
            </View>

            <Animated.View style={inputAnimationStyle}>
              <TextInput
                ref={inputRef}
                focusable
                style={[styles.input, focusedInputKey === "api" && styles.inputFocused]}
                value={apiBaseUrl}
                onChangeText={handleUrlChange}
                placeholder="请输入服务端地址"
                placeholderTextColor={mutedColor}
                autoCapitalize="none"
                autoCorrect={false}
                selection={selection}
                onSelectionChange={({ nativeEvent }) => setSelection(nativeEvent.selection)}
                onFocus={() => handleInputFocus(apiBaseUrl, "api")}
                onBlur={handleInputBlur}
                onLayout={() => {
                  const handle = findNodeHandle(inputRef.current) || undefined;
                  setPrimaryInputHandle(handle);
                }}
                nextFocusUp={nextFocusUp}
                nextFocusDown={secondaryInputHandle}
              />

              <TextInput
                ref={cronInputRef}
                focusable
                style={[styles.input, styles.secondaryInput, focusedInputKey === "cron" && styles.inputFocused]}
                value={cronPassword}
                onChangeText={handleCronPasswordChange}
                placeholder="计划任务密码"
                placeholderTextColor={mutedColor}
                autoCapitalize="none"
                autoCorrect={false}
                onFocus={() => handleInputFocus(cronPassword, "cron")}
                onBlur={handleInputBlur}
                onLayout={() => {
                  const handle = findNodeHandle(cronInputRef.current) || undefined;
                  setSecondaryInputHandle(handle);
                }}
                nextFocusUp={primaryInputHandle}
              />
            </Animated.View>
          </View>
        </Pressable>
      </SettingsSection>
    );
  }
);

APIConfigSection.displayName = "接口配置区块";
