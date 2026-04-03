import React from 'react';
import {Linking, Platform, Pressable, ScrollView, StyleSheet, Text, View} from 'react-native';
import {NativeStackScreenProps} from '@react-navigation/native-stack';
import AnimatedGradientBackground from '../components/AnimatedGradientBackground';
import BottomNavBar from '../components/BottomNavBar';
import GlassCard from '../components/GlassCard';
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
        <Text style={[styles.title, {color: palette.textPrimary}]}>What Is New</Text>
        <Text style={[styles.subtitle, {color: palette.textMuted}]}>Your app will keep improving with frequent releases</Text>

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
            {note.highlights.map(highlight => (
              <Text key={highlight} style={[styles.highlight, {color: palette.textPrimary}]}> 
                - {highlight}
              </Text>
            ))}
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
    marginBottom: 10,
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
  highlight: {
    fontSize: 14,
    fontFamily: Platform.select(typography.body),
    marginBottom: 4,
    lineHeight: 20,
  },
});

export default UpdatesScreen;
