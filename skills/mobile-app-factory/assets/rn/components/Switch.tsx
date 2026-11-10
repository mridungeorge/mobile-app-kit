import React, { useEffect } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import Animated, {
  useAnimatedStyle,
  useReducedMotion,
  useSharedValue,
} from 'react-native-reanimated';
import { Colors, MIN_TARGET } from '../theme';
import { springTo } from '../motion';

const TRACK_WIDTH = 38;
const TRACK_HEIGHT = 22;
const KNOB = 18;
const PAD = (TRACK_HEIGHT - KNOB) / 2;

/**
 * Rune-style switch: 38×22, knob 18, spring on state change.
 * The whole row can be tappable in the parent; this primitive is the control.
 */
export function Switch({
  value,
  onValueChange,
  colors,
  disabled = false,
  accessibilityLabel,
}: {
  value: boolean;
  onValueChange: (next: boolean) => void;
  colors: Colors;
  disabled?: boolean;
  accessibilityLabel?: string;
}) {
  const reduce = useReducedMotion();
  const progress = useSharedValue(value ? 1 : 0);

  useEffect(() => {
    progress.value = springTo(value ? 1 : 0, value ? 'morph' : 'snap', reduce);
  }, [value, progress, reduce]);

  const knob = useAnimatedStyle(() => ({
    transform: [{ translateX: PAD + progress.value * (TRACK_WIDTH - KNOB - PAD * 2) }],
  }));

  return (
    <Pressable
      accessibilityRole="switch"
      accessibilityLabel={accessibilityLabel}
      accessibilityState={{ checked: value, disabled }}
      disabled={disabled}
      hitSlop={Math.max(0, (MIN_TARGET - TRACK_HEIGHT) / 2)}
      onPress={() => onValueChange(!value)}
      style={{ opacity: disabled ? 0.4 : 1 }}
    >
      <View
        style={[
          styles.track,
          { backgroundColor: value ? colors.accent : colors.controlOff },
        ]}
      >
        <Animated.View
          style={[
            styles.knob,
            { backgroundColor: value ? colors.onAccent : colors.card },
            knob,
          ]}
        />
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  track: {
    width: TRACK_WIDTH,
    height: TRACK_HEIGHT,
    borderRadius: TRACK_HEIGHT / 2,
    justifyContent: 'center',
  },
  knob: {
    width: KNOB,
    height: KNOB,
    borderRadius: KNOB / 2,
  },
});
