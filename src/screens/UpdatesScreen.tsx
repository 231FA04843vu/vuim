import React from 'react';
import {Linking, Platform, Pressable, ScrollView, StyleSheet, Text, View} from 'react-native';
import {NativeStackScreenProps} from '@react-navigation/native-stack';
import AnimatedGradientBackground from '../components/AnimatedGradientBackground';
import BottomNavBar from '../components/BottomNavBar';
import GlassCard from '../components/GlassCard';
import {APP_VERSION, PREVIOUS_VERSION, RELEASE_DATE} from '../config/appMeta';
import {FREE_UPDATE_OPTIONS, updateNotes} from '../data/updateNotes';
import {useSubjects} from '../context/SubjectsContext';
import {RootStackParamList} from '../navigation/types';
import {darkPalette, lightPalette, typography} from '../theme';
import {notify} from '../utils/notify';

type Props = NativeStackScreenProps<RootStackParamList, 'Updates'>;

const UpdatesScreen = ({navigation}: Props) => {
  const {isDarkMode} = useSubjects();
  const palette = isDarkMode ? darkPalette : lightPalette;

  const openUpdate = async (url: string) => {
    const canOpen = await Linking.canOpenURL(url);
    if (!canOpen) {
      notify('Update link is not available');
      return;
    }
    await Linking.openURL(url);
  };

  return (
    <View style={styles.container}>
      <AnimatedGradientBackground palette={palette} />
      <ScrollView contentContainerStyle={styles.content}>
        <Text style={[styles.overline, {color: palette.textSecondary}]}>Updates</Text>
        <Text style={[styles.title, {color: palette.textPrimary}]}>Release v{APP_VERSION}</Text>
        <Text style={[styles.subtitle, {color: palette.textMuted}]}>Upgrade preview and release notes for better clarity</Text>

        <GlassCard palette={palette} style={styles.heroCard}>
          <View style={styles.heroTopRow}>
            <Text style={[styles.heroBadge, {color: palette.accent, backgroundColor: palette.accentSoft}]}>New Release</Text>
            <Text style={[styles.heroDate, {color: palette.textMuted}]}>{RELEASE_DATE}</Text>
          </View>
          <Text style={[styles.heroTitle, {color: palette.textPrimary}]}>Update Available: {PREVIOUS_VERSION}{' -> '}{APP_VERSION}</Text>
          <Text style={[styles.heroBody, {color: palette.textSecondary}]}>This update improves theme controls, AI conversation flow, and plan readability for faster study decisions.</Text>

          <View style={styles.previewWrap}>
            <View style={[styles.previewItem, {borderColor: palette.cardBorder, backgroundColor: palette.backgroundAlt}]}> 
              <Text style={[styles.previewTitle, {color: palette.textPrimary}]}>Theme Control</Text>
              <Text style={[styles.previewText, {color: palette.textSecondary}]}>Pick System, Light, or Dark directly in settings.</Text>
            </View>
            <View style={[styles.previewItem, {borderColor: palette.cardBorder, backgroundColor: palette.backgroundAlt}]}> 
              <Text style={[styles.previewTitle, {color: palette.textPrimary}]}>AI Chat Flow</Text>
              <Text style={[styles.previewText, {color: palette.textSecondary}]}>Conversation now follows natural top-to-bottom order.</Text>
            </View>
            <View style={[styles.previewItem, {borderColor: palette.cardBorder, backgroundColor: palette.backgroundAlt}]}> 
              <Text style={[styles.previewTitle, {color: palette.textPrimary}]}>Plan Visibility</Text>
              <Text style={[styles.previewText, {color: palette.textSecondary}]}>Tasks and weekly plans appear as clear step cards.</Text>
            </View>
          </View>
        </GlassCard>

        {FREE_UPDATE_OPTIONS.map(option => (
          <Pressable
            key={option.id}
            style={[styles.updateButton, {backgroundColor: palette.accent}]}
            onPress={() => openUpdate(option.url)}>
            <Text style={styles.updateButtonText}>{option.label}</Text>
          </Pressable>
        ))}

        {updateNotes.map(note => (
          <GlassCard key={note.version} palette={palette} style={styles.card}>
            <Text style={[styles.version, {color: palette.accent}]}>v{note.version}</Text>
            <Text style={[styles.cardTitle, {color: palette.textPrimary}]}>{note.title}</Text>
            <Text style={[styles.date, {color: palette.textSecondary}]}>{note.date}</Text>
            <View style={styles.highlightsWrap}>
              {note.highlights.map(highlight => (
                <View
                  key={highlight}
                  style={[styles.highlightCard, {borderColor: palette.cardBorder, backgroundColor: palette.backgroundAlt}]}> 
                  <Text style={[styles.highlight, {color: palette.textPrimary}]}> {highlight}</Text>
                </View>
              ))}
            </View>
          </GlassCard>
        ))}
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
  overline: {
    fontSize: 11,
    fontFamily: Platform.select(typography.heading),
    fontWeight: '700',
    letterSpacing: 0.8,
    textTransform: 'uppercase',
  },
  title: {
    marginTop: 6,
    fontSize: 30,
    fontFamily: Platform.select(typography.display),
    fontWeight: '700',
  },
  subtitle: {
    marginTop: 4,
    marginBottom: 12,
    fontSize: 14,
    fontFamily: Platform.select(typography.body),
  },
  heroCard: {
    marginBottom: 12,
  },
  heroTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  heroBadge: {
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 4,
    fontSize: 11,
    fontFamily: Platform.select(typography.heading),
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.4,
    overflow: 'hidden',
  },
  heroDate: {
    fontSize: 12,
    fontFamily: Platform.select(typography.body),
  },
  heroTitle: {
    marginTop: 10,
    fontSize: 19,
    fontFamily: Platform.select(typography.heading),
    fontWeight: '700',
    lineHeight: 24,
  },
  heroBody: {
    marginTop: 6,
    fontSize: 14,
    fontFamily: Platform.select(typography.body),
    lineHeight: 21,
  },
  previewWrap: {
    marginTop: 12,
    gap: 8,
  },
  previewItem: {
    borderWidth: 1,
    borderRadius: 12,
    padding: 10,
  },
  previewTitle: {
    fontSize: 13,
    fontFamily: Platform.select(typography.heading),
    fontWeight: '700',
  },
  previewText: {
    marginTop: 2,
    fontSize: 13,
    fontFamily: Platform.select(typography.body),
    lineHeight: 19,
  },
  updateButton: {
    borderRadius: 12,
    paddingVertical: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  updateButtonText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontFamily: Platform.select(typography.heading),
    fontWeight: '700',
    letterSpacing: 0.5,
    textTransform: 'uppercase',
  },
  card: {
    marginBottom: 12,
  },
  version: {
    fontSize: 12,
    fontFamily: Platform.select(typography.heading),
    fontWeight: '700',
    marginBottom: 4,
  },
  cardTitle: {
    fontSize: 16,
    fontFamily: Platform.select(typography.heading),
    fontWeight: '700',
    marginBottom: 2,
  },
  date: {
    fontSize: 12,
    fontFamily: Platform.select(typography.body),
    marginBottom: 8,
  },
  highlightsWrap: {
    gap: 6,
  },
  highlightCard: {
    borderWidth: 1,
    borderRadius: 10,
    paddingVertical: 8,
    paddingHorizontal: 10,
  },
  highlight: {
    fontSize: 13,
    fontFamily: Platform.select(typography.body),
    lineHeight: 19,
  },
});

export default UpdatesScreen;
