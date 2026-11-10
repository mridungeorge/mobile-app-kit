import React, { useEffect, useState } from 'react';
import { AccessibilityInfo, StyleProp, ViewStyle } from 'react-native';
import Animated, { useAnimatedStyle, useSharedValue } from 'react-native-reanimated';
import { springTo, staggerDelay } from '../motion';

/**
 * Enter animation: 12px travel + fade, once, staggered.
 * Respects the OS reduce-motion setting by fading only.
 * Do not wrap every row of a long list — virtualise instead.
 */
export function Reveal({
  children,
  index = 0,
  style,
  delayStep = 32,
}: {
  children: React.ReactNode;
  index?: number;
  style?: StyleProp<ViewStyle>;
  delayStep?: number;
}) {
  const progress = useSharedValue(0);
  const [reduce, setReduce] = useState(false);

  useEffect(() => {
    AccessibilityInfo.isReduceMotionEnabled().then(setReduce);
    const sub = AccessibilityInfo.addEventListener('reduceMotionChanged', setReduce);
    return () => sub.remove();
  }, []);

  useEffect(() => {
    const delay = staggerDelay(index, delayStep);
    progress.value = 0;
    const t = setTimeout(() => {
      progress.value = springTo(1, 'settle', reduce);
    }, delay);
    return () => clearTimeout(t);
  }, [progress, index, delayStep, reduce]);

  const animated = useAnimatedStyle(() => ({
    opacity: progress.value,
    transform: [{ translateY: reduce ? 0 : (1 - progress.value) * 12 }],
  }));

  return <Animated.View style={[style, animated]}>{children}</Animated.View>;
}
