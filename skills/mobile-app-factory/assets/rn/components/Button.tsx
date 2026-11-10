import React from 'react';
import { Pressable, Text, ViewStyle } from 'react-native';
import Animated, { useAnimatedStyle, useSharedValue } from 'react-native-reanimated';
import { Colors, MIN_TARGET, radius, space, type } from '../theme';
import { springTo, springOut } from '../motion';

type Variant = 'primary' | 'secondary' | 'ghost' | 'danger';

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

export function Button({
  label,
  onPress,
  colors,
  variant = 'primary',
  disabled = false,
  style,
}: {
  label: string;
  onPress: () => void;
  colors: Colors;
  variant?: Variant;
  disabled?: boolean;
  style?: ViewStyle;
}) {
  const scale = useSharedValue(1);
  const animated = useAnimatedStyle(() => ({ transform: [{ scale: scale.value }] }));

  const bg =
    variant === 'primary' ? colors.accent
    : variant === 'danger' ? colors.danger
    : variant === 'secondary' ? colors.card
    : 'transparent';
  const fg =
    variant === 'primary' ? colors.onAccent
    : variant === 'danger' ? '#ffffff'
    : colors.text;
  const border = variant === 'secondary' ? colors.border : 'transparent';

  return (
    <AnimatedPressable
      accessibilityRole="button"
      accessibilityLabel={label}
      accessibilityState={{ disabled }}
      disabled={disabled}
      onPress={onPress}
      onPressIn={() => { if (!disabled) scale.value = springTo(0.98, 'instant'); }}
      onPressOut={() => { if (!disabled) scale.value = springOut(1, 'pop'); }}
      style={[
        {
          minHeight: MIN_TARGET,
          paddingHorizontal: space.lg,
          borderRadius: radius.sm,
          alignItems: 'center',
          justifyContent: 'center',
          backgroundColor: bg,
          borderWidth: variant === 'secondary' ? 1 : 0,
          borderColor: border,
          opacity: disabled ? 0.4 : 1,
        },
        animated,
        style,
      ]}
    >
      <Text style={[type.label, { color: fg, fontWeight: '600' }]}>{label}</Text>
    </AnimatedPressable>
  );
}
