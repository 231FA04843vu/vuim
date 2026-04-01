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
import {notify} from '../utils/notify';
import BottomNavBar from '../components/BottomNavBar';

type Props = NativeStackScreenProps<RootStackParamList, 'Home'>;
const WEAK_SUBJECT_THRESHOLD = 60;

const HomeScreen = ({navigation}: Props) => {
  const {records, deleteRecord, isDarkMode} = useSubjects();
  const palette = isDarkMode ? darkPalette : lightPalette;

  const [query, setQuery] = useState('');
  const [sortHighToLow, setSortHighToLow] = useState(true);

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
    justifyContent: 'flex-start',
    marginBottom: 16,
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
  heroCard: {
    marginBottom: 14,
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
