import React from 'react';
import { StyleProp, View, ViewProps, ViewStyle } from 'react-native';
import { Colors, elevation, radius, space } from '../theme';

type Level = 'flat' | 'raised' | 'overlay';

export function Surface({
  colors,
  level = 'flat',
  padded = true,
  style,
  children,
  ...rest
}: ViewProps & {
  colors: Colors;
  level?: Level;
  padded?: boolean;
}) {
  const styleObj: StyleProp<ViewStyle> = [
    {
      backgroundColor: level === 'flat' ? colors.card : colors.cardRaised,
      borderRadius: radius.md,
      padding: padded ? space.md : 0,
      overflow: 'hidden',
    },
    elevation(colors)[level],
    style,
  ];
  return (
    <View style={styleObj} {...rest}>
      {children}
    </View>
  );
}
