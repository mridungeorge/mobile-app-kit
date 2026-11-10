import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { Colors, MIN_TARGET, space, type } from '../theme';

export function ListRow({
  title,
  subtitle,
  leading,
  trailing,
  onPress,
  colors,
  showSeparator = true,
}: {
  title: string;
  subtitle?: string;
  leading?: React.ReactNode;
  trailing?: React.ReactNode;
  onPress?: () => void;
  colors: Colors;
  showSeparator?: boolean;
}) {
  const content = (
    <>
      <View style={styles.inner}>
        {leading ? <View style={styles.leading}>{leading}</View> : null}
        <View style={{ flex: 1 }}>
          <Text numberOfLines={1} style={[type.body, { color: colors.text, fontWeight: '500' }]}>
            {title}
          </Text>
          {subtitle ? (
            <Text numberOfLines={1} style={[type.caption, { color: colors.textSecondary, marginTop: 2 }]}>
              {subtitle}
            </Text>
          ) : null}
        </View>
        {trailing ? <View style={styles.trailing}>{trailing}</View> : null}
      </View>
      {showSeparator ? (
        <View style={[styles.separator, { backgroundColor: colors.separator }]} />
      ) : null}
    </>
  );

  if (!onPress) return <View>{content}</View>;

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={subtitle ? `${title}. ${subtitle}` : title}
      onPress={onPress}
      android_ripple={{ color: colors.press }}
      style={({ pressed }) => [
        { minHeight: Math.max(56, MIN_TARGET), backgroundColor: pressed ? colors.press : 'transparent' },
      ]}
    >
      {content}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  inner: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: space.lg,
    paddingVertical: space.md,
    gap: space.md,
  },
  leading: { width: 24, alignItems: 'center' },
  trailing: { marginLeft: space.sm, alignItems: 'flex-end' },
  separator: { height: StyleSheet.hairlineWidth, marginLeft: space.lg },
});
