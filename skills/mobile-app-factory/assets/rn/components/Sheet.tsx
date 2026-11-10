import React, { useEffect } from 'react';
import { Modal, Pressable, StyleSheet, Text, View } from 'react-native';
import Animated, { useAnimatedStyle, useSharedValue } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Colors, radius, space, type } from '../theme';
import { springTo, springOut } from '../motion';

/**
 * Rune-style sheet: glide in, glide out, scrim, drag handle.
 * Uses RN Modal + Reanimated (no gesture-handler dependency).
 * For swipe-to-dismiss, add react-native-gesture-handler and drive `y` from a pan gesture.
 */
export function Sheet({
  visible,
  onClose,
  title,
  colors,
  children,
}: {
  visible: boolean;
  onClose: () => void;
  title?: string;
  colors: Colors;
  children: React.ReactNode;
}) {
  const y = useSharedValue(560);
  const opacity = useSharedValue(0);
  const insets = useSafeAreaInsets();

  useEffect(() => {
    y.value = visible ? springTo(0, 'glide') : springOut(560, 'glide');
    opacity.value = springTo(visible ? 1 : 0, 'settle');
  }, [visible, opacity, y]);

  const sheetStyle = useAnimatedStyle(() => ({ transform: [{ translateY: y.value }] }));
  const scrimStyle = useAnimatedStyle(() => ({ opacity: opacity.value }));

  return (
    <Modal visible={visible} transparent animationType="none" onRequestClose={onClose} statusBarTranslucent>
      <View style={styles.root}>
        <AnimatedPress
          accessibilityLabel="Close"
          onPress={onClose}
          style={[styles.scrim, scrimStyle]}
        />
        <Animated.View
          style={[
            styles.sheet,
            { backgroundColor: colors.card, paddingBottom: Math.max(insets.bottom, space.lg) },
            sheetStyle,
          ]}
          accessibilityViewIsModal
        >
          <View style={[styles.grabber, { backgroundColor: colors.borderStrong }]} />
          {title ? (
            <Text style={[type.titleSmall, { color: colors.text, paddingHorizontal: space.lg, paddingBottom: space.sm }]}>
              {title}
            </Text>
          ) : null}
          {children}
        </Animated.View>
      </View>
    </Modal>
  );
}

const AnimatedPress = Animated.createAnimatedComponent(Pressable);

const styles = StyleSheet.create({
  root: { flex: 1, justifyContent: 'flex-end' },
  scrim: { ...StyleSheet.absoluteFillObject, backgroundColor: '#000' },
  sheet: {
    borderTopLeftRadius: radius.lg,
    borderTopRightRadius: radius.lg,
    paddingTop: space.sm,
    minHeight: 240,
  },
  grabber: {
    width: 36,
    height: 4,
    borderRadius: 2,
    alignSelf: 'center',
    marginBottom: space.md,
    opacity: 0.6,
  },
});
