import React from 'react';
import {Pressable, StyleSheet, View} from 'react-native';
import {Palette} from '../theme';

type Props = {
  palette: Palette;
  isDarkMode: boolean;
  onPress: () => void;
};

const HamburgerButton = ({palette, isDarkMode, onPress}: Props) => {
  const backgroundColor = isDarkMode ? '#122036' : '#FFFFFF';
  const lineColor = isDarkMode ? '#E5ECF6' : '#0F172A';
  const borderColor = isDarkMode ? 'rgba(161, 184, 214, 0.28)' : 'rgba(205, 218, 237, 0.9)';
  const shadowColor = isDarkMode ? '#000000' : '#1E293B';
  const rippleColor = isDarkMode ? 'rgba(255,255,255,0.18)' : 'rgba(15,23,42,0.08)';

  return (
    <Pressable
      key={isDarkMode ? 'hamburger-dark' : 'hamburger-light'}
      onPress={onPress}
      style={[
        styles.button,
        {
          backgroundColor,
          borderColor,
          shadowColor,
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
