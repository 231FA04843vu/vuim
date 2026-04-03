import React from 'react';
import {Pressable, StyleSheet, View} from 'react-native';
import {Palette} from '../theme';

type Props = {
  palette: Palette;
  onPress: () => void;
};

const HamburgerButton = ({palette, onPress}: Props) => (
  <Pressable
    onPress={onPress}
    style={[
      styles.button,
      {
        backgroundColor: palette.surface,
        borderColor: palette.cardBorder,
        shadowColor: palette.shadow,
      },
    ]}
    android_ripple={{color: 'rgba(255,255,255,0.2)'}}>
    <View style={[styles.line, {backgroundColor: palette.textPrimary}]} />
    <View style={[styles.line, {backgroundColor: palette.textPrimary}]} />
    <View style={[styles.line, {backgroundColor: palette.textPrimary}]} />
  </Pressable>
);

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
