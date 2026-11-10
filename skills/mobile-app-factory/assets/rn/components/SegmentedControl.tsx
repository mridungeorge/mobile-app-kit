import React from 'react';
import { Pressable, Text, View } from 'react-native';
import { Colors, MIN_TARGET, radius, space, type } from '../theme';

export type SegmentOption<T extends string> = { value: T; label: string };

/**
 * 2–4 segments. Selected pill uses card fill + hairline; the track is the control.
 * Selection animation is left to the caller (Rune: `snap`), because layout width
 * measurement differs across platforms.
 */
export function SegmentedControl<T extends string>({
  options,
  value,
  onChange,
  colors,
  accessibilityLabel,
}: {
  options: SegmentOption<T>[];
  value: T;
  onChange: (next: T) => void;
  colors: Colors;
  accessibilityLabel?: string;
}) {
  return (
    <View
      accessibilityRole="tablist"
      accessibilityLabel={accessibilityLabel}
      style={{
        flexDirection: 'row',
        padding: 2,
        borderRadius: radius.md,
        backgroundColor: colors.controlTrack,
        gap: 2,
      }}
    >
      {options.map((option) => {
        const selected = option.value === value;
        return (
          <Pressable
            key={option.value}
            accessibilityRole="tab"
            accessibilityState={{ selected }}
            accessibilityLabel={option.label}
            hitSlop={Math.max(0, (MIN_TARGET - 32) / 2)}
            onPress={() => onChange(option.value)}
            style={{
              flex: 1,
              minHeight: 32,
              alignItems: 'center',
              justifyContent: 'center',
              paddingHorizontal: space.sm,
              borderRadius: radius.sm,
              backgroundColor: selected ? colors.card : 'transparent',
              borderWidth: selected ? 1 : 0,
              borderColor: colors.border,
            }}
          >
            <Text
              numberOfLines={1}
              style={[
                type.label,
                { color: selected ? colors.text : colors.textSecondary, fontWeight: selected ? '600' : '500' },
              ]}
            >
              {option.label}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
}
