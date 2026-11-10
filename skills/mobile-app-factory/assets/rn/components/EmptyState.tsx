import React from 'react';
import { Text, View } from 'react-native';
import { Colors, radius, space, type } from '../theme';
import { Button } from './Button';

/**
 * Empty / error / no-results state. Geometric mark (no stock illustration),
 * one line of explanation, one action. Max two lines of body copy.
 */
export function EmptyState({
  title,
  body,
  colors,
  icon,
  actionLabel,
  onAction,
}: {
  title: string;
  body?: string;
  colors: Colors;
  icon?: React.ReactNode;
  actionLabel?: string;
  onAction?: () => void;
}) {
  return (
    <View
      accessibilityRole="summary"
      style={{ alignItems: 'center', paddingVertical: space.xxl, paddingHorizontal: space.xl }}
    >
      <View
        style={{
          width: 96,
          height: 96,
          borderRadius: radius.xl,
          alignItems: 'center',
          justifyContent: 'center',
          backgroundColor: colors.accentSoft,
          marginBottom: space.lg,
        }}
      >
        {icon}
      </View>
      <Text style={[type.titleSmall, { color: colors.text, textAlign: 'center' }]}>{title}</Text>
      {body ? (
        <Text
          numberOfLines={2}
          style={[
            type.bodySmall,
            { color: colors.textSecondary, textAlign: 'center', marginTop: space.sm, maxWidth: 280 },
          ]}
        >
          {body}
        </Text>
      ) : null}
      {actionLabel && onAction ? (
        <View style={{ marginTop: space.lg, minWidth: 160 }}>
          <Button label={actionLabel} onPress={onAction} colors={colors} />
        </View>
      ) : null}
    </View>
  );
}
