import React from 'react';
import {Pressable, StyleSheet, View} from 'react-native';
import {Palette} from '../theme';

type Props = {
  palette: Palette;
  isDarkMode: boolean;
  onPress: () => void;
};

const HamburgerButton = ({palette, isDarkMode, onPress}: Props) => {
  const backgroundColor = isDarkMode ? palette.surface : '#FFFFFF';
  const lineColor = isDarkMode ? palette.textPrimary : '#334155';
  const rippleColor = isDarkMode ? 'rgba(255,255,255,0.18)' : 'rgba(15,23,42,0.08)';

  return (
    <Pressable
      onPress={onPress}
      style={[
        styles.button,
        {
          backgroundColor,
          borderColor: palette.cardBorder,
          shadowColor: palette.shadow,
        },
      ]}
      android_ripple={{color: rippleColor}}>
      <View style={[styles.line, {backgroundColor: lineColor}]} />
      <View style={[styles.line, {backgroundColor: lineColor}]} />
      <View style={[styles.line, {backgroundColor: lineColor}]} />
    </Pressable>
  );
};

const styles = StyleSheet.create({
  button: {
    width: 46,
    height: 46,
    borderRadius: 15,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
    shadowOpacity: 0.18,
    shadowRadius: 10,
    shadowOffset: {width: 0, height: 5},
    elevation: 6,
    overflow: 'hidden',
  },
  line: {
    width: 16,
    height: 2,
    borderRadius: 2,
  },
});

export default HamburgerButton;
