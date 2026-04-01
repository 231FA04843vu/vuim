import React, {useEffect, useMemo, useRef} from 'react';
import {Animated, StyleSheet, View} from 'react-native';
import {Palette} from '../theme';

type Props = {
  percentage: number;
  palette: Palette;
};

const AnimatedProgressBar = ({percentage, palette}: Props) => {
  const progress = useRef(new Animated.Value(0)).current;
  const shine = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.timing(progress, {
      toValue: Math.max(0, Math.min(100, percentage)),
      duration: 650,
      useNativeDriver: false,
    }).start();
  }, [percentage, progress]);

  useEffect(() => {
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(shine, {
          toValue: 1,
          duration: 1300,
          useNativeDriver: true,
        }),
        Animated.timing(shine, {
          toValue: 0,
          duration: 200,
          useNativeDriver: true,
        }),
      ]),
    );

    loop.start();
    return () => loop.stop();
  }, [shine]);

  const barColor = useMemo(() => {
    if (percentage < 40) {
      return palette.danger;
    }
    if (percentage <= 70) {
      return palette.warning;
    }
    return palette.success;
  }, [palette, percentage]);

  const width = progress.interpolate({
    inputRange: [0, 100],
    outputRange: ['0%', '100%'],
  });

  const shineTranslateX = shine.interpolate({
    inputRange: [0, 1],
    outputRange: [-120, 300],
  });

  return (
    <View
      style={[
        styles.track,
        {
          backgroundColor: palette.accentSoft,
          borderColor: palette.cardBorder,
        },
      ]}>
      <View style={styles.trackInset} />
      <Animated.View style={[styles.fill, {width, backgroundColor: barColor}]}>
        <View style={styles.fillGloss} />
        <Animated.View
          style={[
            styles.sheen,
            {
              transform: [{translateX: shineTranslateX}, {rotate: '12deg'}],
            },
          ]}
        />
      </Animated.View>
    </View>
  );
};

const styles = StyleSheet.create({
  track: {
    width: '100%',
    borderRadius: 999,
    borderWidth: 1,
    overflow: 'hidden',
    height: 8,
    position: 'relative',
  },
  trackInset: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
  },
  fill: {
    height: 8,
    borderRadius: 999,
    overflow: 'hidden',
  },
  fillGloss: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: 3,
    backgroundColor: 'rgba(255, 255, 255, 0.22)',
  },
  sheen: {
    position: 'absolute',
    width: 42,
    height: 14,
    top: -3,
    backgroundColor: 'rgba(255, 255, 255, 0.16)',
  },
});

export default AnimatedProgressBar;
