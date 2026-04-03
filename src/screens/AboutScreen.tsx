import React from 'react';
import {Platform, ScrollView, StyleSheet, Text, View} from 'react-native';
import {NativeStackScreenProps} from '@react-navigation/native-stack';
import {useSubjects} from '../context/SubjectsContext';
import AnimatedGradientBackground from '../components/AnimatedGradientBackground';
import GlassCard from '../components/GlassCard';
import {APP_VERSION} from '../config/appMeta';
import {darkPalette, lightPalette, typography} from '../theme';
import {RootStackParamList} from '../navigation/types';
import BottomNavBar from '../components/BottomNavBar';

type Props = NativeStackScreenProps<RootStackParamList, 'AboutApp'>;

const AboutScreen = ({navigation}: Props) => {
  const {isDarkMode} = useSubjects();
  const palette = isDarkMode ? darkPalette : lightPalette;

  return (
    <View style={styles.container}>
      <AnimatedGradientBackground palette={palette} />
      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.topRow}>
          <View>
            <Text style={[styles.overline, {color: palette.textSecondary}]}>About</Text>
            <Text style={[styles.pageTitle, {color: palette.textPrimary}]}>Vignan Calculator</Text>
            <Text style={[styles.subtitle, {color: palette.textMuted}]}>A focused tool for internal mark management</Text>
            <View style={[styles.versionChip, {backgroundColor: palette.accentSoft}]}> 
              <Text style={[styles.versionChipText, {color: palette.accent}]}>App Version v{APP_VERSION}</Text>
            </View>
          </View>
        </View>
        <GlassCard palette={palette}>
          <Text style={[styles.title, {color: palette.textPrimary}]}>Built for Clarity and Focus</Text>
          <Text style={[styles.body, {color: palette.textSecondary}]}> 
            Vignan Internal Marks Calculator helps you calculate and manage internal marks for all subjects.
          </Text>
          <Text style={[styles.body, {color: palette.textSecondary}]}> 
            It includes fast calculations, result history, editing support, search, sorting, and AI mentoring.
          </Text>
          <Text style={[styles.body, {color: palette.textSecondary}]}> 
            New in v{APP_VERSION}: system/light/dark themes, better AI chat order, and clearer weekly task plans.
          </Text>
          <Text style={[styles.body, {color: palette.textSecondary}]}> 
            Formula: Total = (Pre-T1/10)*6 + (T1/20)*8 + (T2/5)*3 + (T3/5)*3 + T4 + average(CLA1..CLA4)
          </Text>
        </GlassCard>
      </ScrollView>
      <BottomNavBar palette={palette} navigation={navigation} current="Updates" />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 150,
  },
  topRow: {
    flexDirection: 'row',
    justifyContent: 'flex-start',
    alignItems: 'flex-start',
    marginBottom: 16,
  },
  overline: {
    fontSize: 11,
    fontFamily: Platform.select(typography.heading),
    fontWeight: '700',
    letterSpacing: 0.9,
    textTransform: 'uppercase',
  },
  pageTitle: {
    fontSize: 30,
    fontFamily: Platform.select(typography.display),
    fontWeight: '700',
    marginTop: 6,
  },
  subtitle: {
    marginTop: 4,
    fontSize: 14,
    fontFamily: Platform.select(typography.body),
    fontWeight: '500',
  },
  versionChip: {
    alignSelf: 'flex-start',
    marginTop: 10,
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 6,
  },
  versionChipText: {
    fontSize: 11,
    fontFamily: Platform.select(typography.heading),
    fontWeight: '700',
    letterSpacing: 0.4,
    textTransform: 'uppercase',
  },
  title: {
    fontSize: 22,
    fontFamily: Platform.select(typography.heading),
    fontWeight: '700',
    marginBottom: 14,
  },
  body: {
    fontSize: 15,
    fontFamily: Platform.select(typography.body),
    lineHeight: 25,
    marginBottom: 14,
  },
});

export default AboutScreen;
