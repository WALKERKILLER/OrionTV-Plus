import React, { forwardRef, useMemo, useState } from "react";
import {
  Animated,
  Pressable,
  PressableProps,
  StyleProp,
  StyleSheet,
  TextStyle,
  View,
  ViewStyle,
} from "react-native";
import { ThemedText } from "./ThemedText";
import { useButtonAnimation } from "@/hooks/useAnimation";
import { useThemeColor } from "@/hooks/useThemeColor";

interface StyledButtonProps extends PressableProps {
  children?: React.ReactNode;
  text?: string;
  variant?: "default" | "primary" | "ghost";
  isSelected?: boolean;
  style?: StyleProp<ViewStyle>;
  textStyle?: StyleProp<TextStyle>;
}

export const StyledButton = forwardRef<View, StyledButtonProps>(
  ({ children, text, variant = "default", isSelected = false, style, textStyle, disabled, ...rest }, ref) => {
    const [isFocused, setIsFocused] = useState(false);
    const animationStyle = useButtonAnimation(isFocused, 1.03);

    const textColor = useThemeColor({}, "text");
    const surfaceColor = useThemeColor({}, "surface");
    const surfaceVariantColor = useThemeColor({}, "surfaceVariant");
    const borderColor = useThemeColor({}, "outlineVariant");
    const primaryColor = useThemeColor({}, "primary");
    const onPrimaryColor = useThemeColor({}, "onPrimary");
    const focusRingColor = useThemeColor({}, "focusRing");

    const palette = useMemo(
      () => ({
        default: {
          container: {
            backgroundColor: surfaceVariantColor,
            borderColor,
          },
          text: textColor,
          selectedContainer: {
            backgroundColor: primaryColor,
            borderColor: primaryColor,
          },
          selectedText: onPrimaryColor,
        },
        primary: {
          container: {
            backgroundColor: primaryColor,
            borderColor: primaryColor,
          },
          text: onPrimaryColor,
          selectedContainer: {
            backgroundColor: primaryColor,
            borderColor: primaryColor,
          },
          selectedText: onPrimaryColor,
        },
        ghost: {
          container: {
            backgroundColor: "transparent",
            borderColor,
          },
          text: textColor,
          selectedContainer: {
            backgroundColor: surfaceColor,
            borderColor: primaryColor,
          },
          selectedText: textColor,
        },
      }),
      [borderColor, onPrimaryColor, primaryColor, surfaceColor, surfaceVariantColor, textColor]
    );

    const variantStyle = palette[variant];

    return (
      <Animated.View style={[animationStyle, style]}>
        <Pressable
          ref={ref}
          focusable
          disabled={disabled}
          onFocus={() => setIsFocused(true)}
          onBlur={() => setIsFocused(false)}
          style={({ focused, pressed }) => [
            styles.button,
            variantStyle.container,
            isSelected && variantStyle.selectedContainer,
            focused && {
              borderColor: textColor,
              borderWidth: 3,
              shadowColor: focusRingColor,
              shadowOpacity: 0.6,
              shadowRadius: 12,
              shadowOffset: { width: 0, height: 0 },
              elevation: 8,
            },
            pressed && !disabled && styles.pressed,
            disabled && styles.disabled,
          ]}
          {...rest}
        >
          {text ? (
            <ThemedText
              style={[
                styles.text,
                { color: variantStyle.text },
                textStyle,
                isSelected && { color: variantStyle.selectedText },
              ]}
            >
              {text}
            </ThemedText>
          ) : (
            children
          )}
        </Pressable>
      </Animated.View>
    );
  }
);

StyledButton.displayName = "StyledButton";

const styles = StyleSheet.create({
  button: {
    minHeight: 52,
    minWidth: 52,
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 16,
    borderWidth: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
  },
  text: {
    fontSize: 16,
    fontWeight: "600",
    letterSpacing: 0.2,
  },
  pressed: {
    opacity: 0.88,
    transform: [{ scale: 0.985 }],
  },
  disabled: {
    opacity: 0.45,
  },
});
