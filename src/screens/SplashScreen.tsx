import React, {useEffect, useRef} from 'react';
import {Animated, Easing, Image, Platform, StyleSheet, Text, View} from 'react-native';
import {NativeStackScreenProps} from '@react-navigation/native-stack';
import {RootStackParamList} from '../navigation/types';
import {darkPalette, lightPalette, typography} from '../theme';
import AnimatedGradientBackground from '../components/AnimatedGradientBackground';
import {useSubjects} from '../context/SubjectsContext';

type Props = NativeStackScreenProps<RootStackParamList, 'Splash'>;

const SplashScreen = ({navigation}: Props) => {
  const {isDarkMode} = useSubjects();
  const palette = isDarkMode ? darkPalette : lightPalette;
  const fade = useRef(new Animated.Value(0)).current;
  const scale = useRef(new Animated.Value(0.85)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fade, {
        toValue: 1,
        duration: 1100,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true,
      }),
      Animated.spring(scale, {
        toValue: 1,
        useNativeDriver: true,
        speed: 11,
        bounciness: 8,
      }),
    ]).start();

    const timer = setTimeout(() => {
      navigation.replace('Home');
    }, 2400);

    return () => clearTimeout(timer);
  }, [fade, navigation, scale]);

  return (
    <View style={styles.container}>
      <AnimatedGradientBackground palette={palette} />
      <Animated.View style={[styles.logoWrap, {opacity: fade, transform: [{scale}]}]}>
        <Image source={require('../../assets/app-icon.png')} style={styles.logoImage} resizeMode="contain" />
      </Animated.View>
      <Text style={[styles.title, {color: palette.textPrimary}]}>Academic Marks Companion</Text>
      <Text style={[styles.subtitle, {color: palette.textSecondary}]}>Calm, reliable internal marks tracking</Text>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
  },
  logoWrap: {
    width: 96,
    height: 96,
    borderRadius: 22,
    backgroundColor: 'rgba(255, 255, 255, 0.42)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 24,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.8)',
    shadowColor: '#0F172A',
    shadowOpacity: 0.12,
    shadowRadius: 14,
    shadowOffset: {width: 0, height: 6},
    elevation: 4,
  },
  logoImage: {
    width: 72,
    height: 72,
    borderRadius: 16,
  },
  title: {
    fontSize: 24,
    fontFamily: Platform.select(typography.heading),
    fontWeight: '700',
    textAlign: 'center',
    lineHeight: 31,
  },
  subtitle: {
    marginTop: 10,
    fontSize: 14,
    fontFamily: Platform.select(typography.body),
    fontWeight: '500',
    letterSpacing: 0.1,
  },
});

export default SplashScreen;
