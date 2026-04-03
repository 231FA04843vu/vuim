import React, {useMemo, useState} from 'react';
import {Alert, FlatList, Platform, Pressable, StyleSheet, Text, View} from 'react-native';
import {NativeStackScreenProps} from '@react-navigation/native-stack';
import {RootStackParamList} from '../navigation/types';
import {useSubjects} from '../context/SubjectsContext';
import {darkPalette, lightPalette, typography} from '../theme';
import AnimatedGradientBackground from '../components/AnimatedGradientBackground';
import AnimatedInput from '../components/AnimatedInput';
import SubjectCard from '../components/SubjectCard';
import GlassCard from '../components/GlassCard';
import SideDrawerMenu from '../components/SideDrawerMenu';
import {APP_VERSION} from '../config/appMeta';
import {updateNotes} from '../data/updateNotes';
import {notify} from '../utils/notify';
import BottomNavBar from '../components/BottomNavBar';

type Props = NativeStackScreenProps<RootStackParamList, 'Home'>;
const WEAK_SUBJECT_THRESHOLD = 60;

const compareSemver = (left: string, right: string) => {
  const leftParts = left.split('.').map(Number);
  const rightParts = right.split('.').map(Number);
  const max = Math.max(leftParts.length, rightParts.length);

  for (let i = 0; i < max; i += 1) {
    const l = Number.isFinite(leftParts[i]) ? leftParts[i] : 0;
    const r = Number.isFinite(rightParts[i]) ? rightParts[i] : 0;
    if (l > r) {
      return 1;
    }
    if (l < r) {
      return -1;
    }
  }

  return 0;
};

const HomeScreen = ({navigation}: Props) => {
  const {records, deleteRecord, isDarkMode} = useSubjects();
  const palette = isDarkMode ? darkPalette : lightPalette;

  const [query, setQuery] = useState('');
  const [sortHighToLow, setSortHighToLow] = useState(true);
  const [drawerVisible, setDrawerVisible] = useState(false);

  const data = useMemo(() => {
    const filtered = records.filter(item =>
      item.subjectName.toLowerCase().includes(query.trim().toLowerCase()),
    );

    return [...filtered].sort((a, b) =>
      sortHighToLow ? b.total - a.total : a.subjectName.localeCompare(b.subjectName),
    );
  }, [query, records, sortHighToLow]);

  const stats = useMemo(() => {
    const totalSubjects = records.length;
    const avgPercent =
      totalSubjects === 0
        ? 0
        : records.reduce((acc, item) => acc + item.percentage, 0) / totalSubjects;

    return {
      totalSubjects,
      avgPercent,
    };
  }, [records]);

  const latestRelease = updateNotes[0]?.version;
  const hasUpdate = !!latestRelease && compareSemver(latestRelease, APP_VERSION) > 0;

  const confirmDelete = (id: string) => {
    Alert.alert('Delete Subject', 'Do you want to remove this record?', [
      {text: 'Cancel', style: 'cancel'},
      {
        text: 'Delete',
        style: 'destructive',
        onPress: async () => {
          await deleteRecord(id);
          notify('Record deleted');
        },
      },
    ]);
  };

  return (
    <View style={styles.container}>
      <AnimatedGradientBackground palette={palette} />
      <View style={styles.inner}>
        <View style={styles.topRow}>
          <View>
            <Text style={[styles.overline, {color: palette.textSecondary}]}>Overview</Text>
            <Text style={[styles.title, {color: palette.textPrimary}]}>Academic Dashboard</Text>
            <Text style={[styles.subtitle, {color: palette.textMuted}]}>Simple, focused tracking for every subject</Text>
          </View>
          <Pressable
            style={[styles.menuButton, {borderColor: palette.cardBorder, backgroundColor: palette.backgroundAlt}]}
            onPress={() => setDrawerVisible(true)}>
            <Text style={[styles.menuButtonText, {color: palette.textPrimary}]}>Menu</Text>
          </Pressable>
        </View>

        <GlassCard palette={palette} style={styles.heroCard}>
          <Text style={[styles.heroTitle, {color: palette.textPrimary}]}>Performance Snapshot</Text>
          <Text style={[styles.heroSubtitle, {color: palette.textSecondary}]}>Live summary from your saved data</Text>
          <View style={styles.heroStatsRow}>
            <View style={[styles.heroStatChip, {backgroundColor: palette.accentSoft}]}> 
              <Text style={[styles.heroStatValue, {color: palette.accent}]}>{stats.totalSubjects}</Text>
              <Text style={[styles.heroStatLabel, {color: palette.textSecondary}]}>Subjects</Text>
            </View>
            <View style={[styles.heroStatChip, {backgroundColor: palette.accentSoft}]}> 
              <Text style={[styles.heroStatValue, {color: palette.accent}]}>{stats.avgPercent.toFixed(1)}%</Text>
              <Text style={[styles.heroStatLabel, {color: palette.textSecondary}]}>Avg Score</Text>
            </View>
          </View>
        </GlassCard>

        {hasUpdate && (
          <GlassCard palette={palette} style={styles.updateCard}>
            <Text style={[styles.updateTitle, {color: palette.textPrimary}]}>Update Available</Text>
            <Text style={[styles.updateBody, {color: palette.textSecondary}]}>A newer version ({latestRelease}) is ready. You are on v{APP_VERSION}.</Text>
            <Pressable
              style={[styles.updateButton, {backgroundColor: palette.accent}]}
              onPress={() => navigation.navigate('Updates')}>
              <Text style={styles.updateButtonText}>View What Is New</Text>
            </Pressable>
          </GlassCard>
        )}

        <AnimatedInput
          label="Search Subject"
          value={query}
          onChangeText={setQuery}
          palette={palette}
          placeholder="Type subject name"
        />

        <Pressable
          style={[
            styles.sortChip,
            {borderColor: palette.cardBorder, backgroundColor: palette.backgroundAlt},
          ]}
          android_ripple={{color: 'rgba(255,255,255,0.2)'}}
          onPress={() => setSortHighToLow(prev => !prev)}>
          <Text style={[styles.sortText, {color: palette.textPrimary}]}> 
            Sort: {sortHighToLow ? 'Marks High to Low' : 'Name A to Z'}
          </Text>
        </Pressable>

        <FlatList
          data={data}
          keyExtractor={item => item.id}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.listContent}
          renderItem={({item}) => (
            <SubjectCard
              item={item}
              palette={palette}
              showCoachTag={item.percentage < WEAK_SUBJECT_THRESHOLD}
              onPress={subjectName => navigation.navigate('SubjectPerformance', {subjectName})}
              onEdit={id => navigation.navigate('SubjectForm', {recordId: id})}
              onDelete={confirmDelete}
            />
          )}
          ListEmptyComponent={
            <View style={[styles.emptyBox, {borderColor: palette.cardBorder, backgroundColor: palette.card}]}> 
              <Text style={[styles.emptyTitle, {color: palette.textPrimary}]}>No subjects yet</Text>
              <Text style={[styles.emptyText, {color: palette.textSecondary}]}>Use Add tab to create your first subject record.</Text>
            </View>
          }
        />
      </View>

      <BottomNavBar palette={palette} navigation={navigation} current="Home" />
      <SideDrawerMenu
        visible={drawerVisible}
        onClose={() => setDrawerVisible(false)}
        palette={palette}
        navigation={navigation}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  inner: {
    flex: 1,
    paddingHorizontal: 20,
    paddingTop: 20,
  },
  topRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    marginBottom: 16,
    gap: 10,
  },
  overline: {
    fontSize: 11,
    fontFamily: Platform.select(typography.heading),
    fontWeight: '700',
    letterSpacing: 0.9,
    textTransform: 'uppercase',
  },
  title: {
    fontSize: 30,
    fontFamily: Platform.select(typography.display),
    fontWeight: '700',
    marginTop: 6,
    lineHeight: 36,
  },
  subtitle: {
    marginTop: 4,
    fontSize: 14,
    fontFamily: Platform.select(typography.body),
    fontWeight: '500',
  },
  menuButton: {
    borderWidth: 1,
    borderRadius: 999,
    paddingHorizontal: 14,
    paddingVertical: 9,
  },
  menuButtonText: {
    fontSize: 11,
    fontFamily: Platform.select(typography.heading),
    fontWeight: '700',
    letterSpacing: 0.7,
    textTransform: 'uppercase',
  },
  heroCard: {
    marginBottom: 14,
  },
  updateCard: {
    marginBottom: 14,
  },
  updateTitle: {
    fontSize: 16,
    fontFamily: Platform.select(typography.heading),
    fontWeight: '700',
  },
  updateBody: {
    marginTop: 4,
    fontSize: 13,
    fontFamily: Platform.select(typography.body),
    lineHeight: 20,
  },
  updateButton: {
    alignSelf: 'flex-start',
    marginTop: 10,
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 9,
  },
  updateButtonText: {
    color: '#FFFFFF',
    fontSize: 11,
    fontFamily: Platform.select(typography.heading),
    fontWeight: '700',
    letterSpacing: 0.5,
    textTransform: 'uppercase',
  },
  heroTitle: {
    fontSize: 17,
    fontFamily: Platform.select(typography.heading),
    fontWeight: '700',
  },
  heroSubtitle: {
    marginTop: 4,
    fontSize: 13,
    fontFamily: Platform.select(typography.body),
    marginBottom: 14,
  },
  heroStatsRow: {
    flexDirection: 'row',
    gap: 12,
  },
  heroStatChip: {
    flex: 1,
    borderRadius: 16,
    paddingVertical: 12,
    paddingHorizontal: 14,
  },
  heroStatValue: {
    fontSize: 23,
    fontFamily: Platform.select(typography.heading),
    fontWeight: '700',
  },
  heroStatLabel: {
    marginTop: 4,
    fontSize: 11,
    fontFamily: Platform.select(typography.heading),
    fontWeight: '600',
    letterSpacing: 0.6,
    textTransform: 'uppercase',
  },
  sortChip: {
    alignSelf: 'flex-start',
    borderWidth: 1,
    borderRadius: 999,
    marginBottom: 14,
    overflow: 'hidden',
    paddingHorizontal: 16,
    paddingVertical: 10,
  },
  sortText: {
    fontSize: 11,
    fontFamily: Platform.select(typography.heading),
    fontWeight: '700',
    letterSpacing: 0.6,
    textTransform: 'uppercase',
  },
  listContent: {
    paddingBottom: 146,
  },
  emptyBox: {
    marginTop: 18,
    borderWidth: 1,
    borderRadius: 20,
    padding: 22,
  },
  emptyTitle: {
    fontSize: 19,
    fontFamily: Platform.select(typography.heading),
    fontWeight: '700',
    marginBottom: 6,
  },
  emptyText: {
    fontSize: 15,
    fontFamily: Platform.select(typography.body),
    lineHeight: 22,
  },
});

export default HomeScreen;
