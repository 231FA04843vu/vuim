import React, {useRef, useState} from 'react';
import {
  Animated,
  NativeSyntheticEvent,
  Platform,
  StyleSheet,
  Text,
  TextInput,
  TextInputFocusEventData,
  TextInputProps,
  View,
} from 'react-native';
import {Palette, typography} from '../theme';

type Props = TextInputProps & {
  label: string;
  palette: Palette;
};

const AnimatedInput = ({label, palette, onFocus, onBlur, style, ...rest}: Props) => {
  const [focused, setFocused] = useState(false);
  const scale = useRef(new Animated.Value(1)).current;
  const shellStyle = {
    borderColor: focused ? palette.accent : palette.cardBorder,
    shadowColor: focused ? palette.accent : palette.shadow,
    backgroundColor: palette.surface,
    transform: [{scale}],
  };

  const animate = (toValue: number) => {
    Animated.spring(scale, {
      toValue,
      useNativeDriver: true,
      speed: 18,
      bounciness: 6,
    }).start();
  };

  const handleFocus = (e: NativeSyntheticEvent<TextInputFocusEventData>) => {
    setFocused(true);
    animate(1.02);
    onFocus?.(e);
  };

  const handleBlur = (e: NativeSyntheticEvent<TextInputFocusEventData>) => {
    setFocused(false);
    animate(1);
    onBlur?.(e);
  };

  return (
    <View style={styles.wrapper}>
      <Text style={[styles.label, {color: palette.textSecondary}]}>{label}</Text>
      <Animated.View
        style={[
          styles.inputShell,
          shellStyle,
        ]}>
        <TextInput
          placeholderTextColor={palette.textSecondary}
          onFocus={handleFocus}
          onBlur={handleBlur}
          style={[styles.input, {color: palette.textPrimary}, style]}
          {...rest}
        />
      </Animated.View>
    </View>
  );
};

const styles = StyleSheet.create({
  wrapper: {
    marginBottom: 14,
  },
  label: {
    fontSize: 11,
    fontFamily: Platform.select(typography.heading),
    fontWeight: '700',
    letterSpacing: 0.7,
    marginBottom: 8,
    textTransform: 'uppercase',
  },
  inputShell: {
    borderRadius: 16,
    borderWidth: 1,
    paddingHorizontal: 14,
    shadowOpacity: 0.14,
    shadowOffset: {width: 0, height: 7},
    shadowRadius: 14,
    elevation: 6,
  },
  input: {
    fontSize: 15,
    fontFamily: Platform.select(typography.body),
    fontWeight: '500',
    paddingVertical: 12,
  },
});

export default AnimatedInput;
