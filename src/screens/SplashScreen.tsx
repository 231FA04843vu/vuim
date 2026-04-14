import React, {useEffect, useRef} from 'react';
import {Animated, Easing, Image, Platform, StyleSheet, Text, View} from 'react-native';
import {NativeStackScreenProps} from '@react-navigation/native-stack';
import {RootStackParamList} from '../navigation/types';
import {typography} from '../theme';

type Props = NativeStackScreenProps<RootStackParamList, 'Splash'>;

const SplashScreen = ({navigation}: Props) => {
  const fade = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.timing(fade, {
      toValue: 1,
      duration: 450,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: true,
    }).start();

    const timer = setTimeout(() => {
      navigation.replace('Home');
    }, 850);

    return () => clearTimeout(timer);
  }, [fade, navigation]);

  return (
    <View style={styles.container}>
      <Animated.View style={[styles.content, {opacity: fade}]}>
        <Image source={require('../../assets/app-icon.png')} style={styles.logoImage} resizeMode="contain" />
        <Text style={styles.title}>Academic Marks Companion</Text>
        <Text style={styles.subtitle}>Calm, reliable internal marks tracking</Text>
      </Animated.View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  content: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 24,
  },
  logoImage: {
    width: 110,
    height: 110,
    marginBottom: 26,
  },
  title: {
    color: '#111827',
    fontSize: 23,
    fontFamily: Platform.select(typography.heading),
    fontWeight: '700',
    textAlign: 'center',
    lineHeight: 30,
  },
  subtitle: {
    color: '#4B5563',
    marginTop: 10,
    fontSize: 14,
    fontFamily: Platform.select(typography.body),
    fontWeight: '500',
    textAlign: 'center',
  },
});

export default SplashScreen;
