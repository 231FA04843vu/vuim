import React from 'react';
import {StyleProp, StyleSheet, View, ViewStyle} from 'react-native';
import {Palette} from '../theme';

type Props = {
  children: React.ReactNode;
  palette: Palette;
  style?: StyleProp<ViewStyle>;
};

const GlassCard = ({children, palette, style}: Props) => (
  <View
    style={[
      styles.card,
      {
        backgroundColor: palette.card,
        borderColor: palette.cardBorder,
        shadowColor: palette.shadow,
      },
      style,
    ]}>
    {children}
  </View>
);

const styles = StyleSheet.create({
  card: {
    borderWidth: 1,
    borderRadius: 22,
    padding: 18,
    shadowOpacity: 0.14,
    shadowRadius: 20,
    shadowOffset: {
      width: 0,
      height: 10,
    },
    elevation: 7,
  },
});

export default GlassCard;
