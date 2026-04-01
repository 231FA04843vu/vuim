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
      },
      style,
    ]}>
    {children}
  </View>
);

const styles = StyleSheet.create({
  card: {
    borderWidth: 1,
    borderRadius: 18,
    padding: 18,
    shadowColor: '#0F172A',
    shadowOpacity: 0.08,
    shadowRadius: 16,
    shadowOffset: {
      width: 0,
      height: 6,
    },
    elevation: 4,
  },
});

export default GlassCard;
