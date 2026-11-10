import React, { useState } from 'react';
import {
  KeyboardTypeOptions,
  StyleProp,
  Text,
  TextInput,
  View,
  ViewStyle,
} from 'react-native';
import { Colors, MIN_TARGET, radius, space, type } from '../theme';

/**
 * Field + input in one primitive. Label above, error below, 44pt target.
 * Validation fires on blur by default; the screen owns the error text.
 */
export function TextField({
  label,
  value,
  onChangeText,
  colors,
  placeholder,
  error,
  helper,
  secureTextEntry = false,
  multiline = false,
  editable = true,
  maxLength,
  keyboardType = 'default',
  autoCapitalize = 'sentences',
  autoComplete,
  style,
}: {
  label: string;
  value: string;
  onChangeText: (text: string) => void;
  colors: Colors;
  placeholder?: string;
  error?: string;
  helper?: string;
  secureTextEntry?: boolean;
  multiline?: boolean;
  editable?: boolean;
  maxLength?: number;
  keyboardType?: KeyboardTypeOptions;
  autoCapitalize?: 'none' | 'sentences' | 'words' | 'characters';
  autoComplete?: React.ComponentProps<typeof TextInput>['autoComplete'];
  style?: StyleProp<ViewStyle>;
}) {
  const [focused, setFocused] = useState(false);
  const borderColor = error ? colors.danger : focused ? colors.accent : colors.border;
  const message = error ?? helper;

  return (
    <View style={style}>
      <Text style={[type.caption, { color: colors.textSecondary, marginBottom: space.xs }]}>
        {label}
      </Text>
      <TextInput
        accessibilityLabel={label}
        accessibilityHint={message}
        accessibilityState={{ disabled: !editable }}
        value={value}
        onChangeText={onChangeText}
        onFocus={() => setFocused(true)}
        onBlur={() => setFocused(false)}
        placeholder={placeholder}
        placeholderTextColor={colors.textTertiary}
        secureTextEntry={secureTextEntry}
        multiline={multiline}
        editable={editable}
        maxLength={maxLength}
        keyboardType={keyboardType}
        autoCapitalize={autoCapitalize}
        autoComplete={autoComplete}
        textAlignVertical={multiline ? 'top' : 'center'}
        style={[
          type.body,
          {
            minHeight: multiline ? 88 : MIN_TARGET,
            paddingHorizontal: space.md,
            paddingVertical: multiline ? space.sm : 0,
            borderRadius: radius.sm,
            borderWidth: 1,
            borderColor,
            backgroundColor: colors.controlTrack,
            color: colors.text,
            opacity: editable ? 1 : 0.5,
          },
        ]}
      />
      {message ? (
        <Text
          accessibilityLiveRegion="polite"
          style={[type.caption, { color: error ? colors.danger : colors.textSecondary, marginTop: space.xs }]}
        >
          {message}
        </Text>
      ) : null}
    </View>
  );
}
