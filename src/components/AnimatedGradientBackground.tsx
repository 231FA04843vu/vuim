import React, {useEffect, useRef} from 'react';
import {Animated, Easing, StyleSheet, View} from 'react-native';
import {Palette} from '../theme';

type Props = {
  palette: Palette;
};

const AnimatedGradientBackground = ({palette}: Props) => {
  const wave = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(wave, {
          toValue: 1,
          duration: 8500,
          easing: Easing.inOut(Easing.quad),
          useNativeDriver: true,
        }),
        Animated.timing(wave, {
          toValue: 0,
          duration: 8500,
          easing: Easing.inOut(Easing.quad),
          useNativeDriver: true,
        }),
      ]),
    );

    loop.start();
    return () => loop.stop();
  }, [wave]);

  const blob1 = {
    transform: [
      {
        translateX: wave.interpolate({
          inputRange: [0, 1],
          outputRange: [-12, 16],
        }),
      },
      {
        translateY: wave.interpolate({
          inputRange: [0, 1],
          outputRange: [0, -10],
        }),
      },
      {
        scale: wave.interpolate({
          inputRange: [0, 1],
          outputRange: [1, 1.06],
        }),
      },
    ],
  };

  const blob2 = {
    transform: [
      {
        translateX: wave.interpolate({
          inputRange: [0, 1],
          outputRange: [10, -12],
        }),
      },
      {
        translateY: wave.interpolate({
          inputRange: [0, 1],
          outputRange: [0, 12],
        }),
      },
      {
        scale: wave.interpolate({
          inputRange: [0, 1],
          outputRange: [1, 1.08],
        }),
      },
    ],
  };

  const blob3 = {
    transform: [
      {
        translateX: wave.interpolate({
          inputRange: [0, 1],
          outputRange: [0, 8],
        }),
      },
      {
        translateY: wave.interpolate({
          inputRange: [0, 1],
          outputRange: [0, -8],
        }),
      },
    ],
  };

  const sheen = {
    transform: [
      {
        translateX: wave.interpolate({
          inputRange: [0, 1],
          outputRange: [-40, 24],
        }),
      },
      {
        rotate: wave.interpolate({
          inputRange: [0, 1],
          outputRange: ['-5deg', '5deg'],
        }),
      },
    ],
  };

  return (
    <View style={[styles.root, {backgroundColor: palette.background}]}> 
      <View style={[styles.gridLayer, {backgroundColor: palette.backgroundElevated}]} />
      <Animated.View style={[styles.blob, styles.blobA, {backgroundColor: palette.gradientA}, blob1]} />
      <Animated.View style={[styles.blob, styles.blobB, {backgroundColor: palette.gradientB}, blob2]} />
      <Animated.View style={[styles.blob, styles.blobC, {backgroundColor: palette.gradientC}, blob3]} />
      <Animated.View style={[styles.sheen, {backgroundColor: 'rgba(255, 255, 255, 0.14)'}, sheen]} />
      <View style={styles.vignette} />
    </View>
  );
};

const styles = StyleSheet.create({
  root: {
    ...StyleSheet.absoluteFillObject,
    overflow: 'hidden',
  },
  gridLayer: {
    ...StyleSheet.absoluteFillObject,
    borderWidth: 0,
    opacity: 0.35,
  },
  blob: {
    position: 'absolute',
    borderRadius: 999,
    opacity: 0.42,
  },
  blobA: {
    width: 280,
    height: 280,
    top: -64,
    left: -50,
  },
  blobB: {
    width: 300,
    height: 300,
    bottom: -126,
    right: -78,
  },
  blobC: {
    width: 200,
    height: 200,
    top: '39%',
    left: '32%',
  },
  sheen: {
    position: 'absolute',
    width: 260,
    height: 540,
    right: -90,
    top: -90,
    borderRadius: 100,
    opacity: 0.16,
  },
  vignette: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(8, 14, 24, 0.05)',
  },
});

export default AnimatedGradientBackground;
