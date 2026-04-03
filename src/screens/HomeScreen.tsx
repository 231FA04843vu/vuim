import React, {useMemo, useState} from 'react';
import {Alert, FlatList, Platform, Pressable, StyleSheet, Text, View} from 'react-native';
import {NativeStackScreenProps} from '@react-navigation/native-stack';
import {useSafeAreaInsets} from 'react-native-safe-area-context';
import {RootStackParamList} from '../navigation/types';
import {useSubjects} from '../context/SubjectsContext';
import {darkPalette, lightPalette, typography} from '../theme';
import AnimatedGradientBackground from '../components/AnimatedGradientBackground';
import AnimatedInput from '../components/AnimatedInput';
import SubjectCard from '../components/SubjectCard';
import GlassCard from '../components/GlassCard';
import HamburgerButton from '../components/HamburgerButton';
import SideDrawerMenu from '../components/SideDrawerMenu';
import {notify} from '../utils/notify';

type Props = NativeStackScreenProps<RootStackParamList, 'Home'>;
const HomeScreen = ({navigation}: Props) => {
  const insets = useSafeAreaInsets();
  const {records, deleteRecord, isDarkMode} = useSubjects();
  const palette = isDarkMode ? darkPalette : lightPalette;

  const [query, setQuery] = useState('');
  const [sortHighToLow, setSortHighToLow] = useState(true);
  const [menuVisible, setMenuVisible] = useState(false);

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
        <View style={[styles.topRow, {marginTop: Math.max(8, insets.top + 6)}]}>
          <HamburgerButton palette={palette} isDarkMode={isDarkMode} onPress={() => setMenuVisible(true)} />
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

        <View style={styles.searchHeadRow}>
          <Text style={[styles.searchHeadTitle, {color: palette.textPrimary}]}>Search Subjects</Text>
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
        </View>

        <AnimatedInput
          label="Search"
          value={query}
          onChangeText={setQuery}
          palette={palette}
          placeholder="Search subjects..."
        />

        <FlatList
          data={data}
          keyExtractor={item => item.id}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.listContent}
          renderItem={({item}) => (
            <SubjectCard
              item={item}
              palette={palette}
              showCoachTag={false}
              onPress={subjectName => navigation.navigate('SubjectPerformance', {subjectName})}
              onEdit={id => navigation.navigate('SubjectForm', {recordId: id})}
              onDelete={confirmDelete}
            />
          )}
          ListEmptyComponent={
            <View style={[styles.emptyBox, {borderColor: palette.cardBorder, backgroundColor: palette.card}]}> 
              <Text style={[styles.emptyTitle, {color: palette.textPrimary}]}>No subjects yet</Text>
              <Text style={[styles.emptyText, {color: palette.textSecondary}]}>Use the + button to create your first subject record.</Text>
            </View>
          }
        />
      </View>

      <Pressable
        style={[
          styles.fab,
          {
            right: 20,
            bottom: Math.max(20, insets.bottom + 8),
            backgroundColor: palette.accent,
            shadowColor: palette.shadow,
          },
        ]}
        onPress={() => navigation.navigate('SubjectForm')}
        android_ripple={{color: 'rgba(255,255,255,0.25)'}}>
        <Text style={styles.fabText}>+</Text>
      </Pressable>

      <SideDrawerMenu
        visible={menuVisible}
        onClose={() => setMenuVisible(false)}
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
    paddingTop: 0,
  },
  topRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
    marginBottom: 14,
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
    marginTop: 6,
    fontSize: 14,
    fontFamily: Platform.select(typography.body),
    fontWeight: '500',
    lineHeight: 20,
  },
  heroCard: {
    marginBottom: 14,
  },
  heroTitle: {
    fontSize: 17,
    fontFamily: Platform.select(typography.heading),
    fontWeight: '700',
    lineHeight: 22,
  },
  heroSubtitle: {
    marginTop: 4,
    fontSize: 13,
    fontFamily: Platform.select(typography.body),
    marginBottom: 14,
    lineHeight: 18,
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
    lineHeight: 28,
  },
  heroStatLabel: {
    marginTop: 4,
    fontSize: 11,
    fontFamily: Platform.select(typography.heading),
    fontWeight: '600',
    letterSpacing: 0.6,
    textTransform: 'uppercase',
  },
  searchHeadRow: {
    marginTop: 2,
    marginBottom: 4,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 10,
  },
  searchHeadTitle: {
    fontFamily: Platform.select(typography.heading),
    fontWeight: '700',
    fontSize: 14,
    textTransform: 'uppercase',
    letterSpacing: 0.6,
  },
  sortChip: {
    borderWidth: 1,
    borderRadius: 999,
    overflow: 'hidden',
    paddingHorizontal: 14,
    paddingVertical: 8,
  },
  sortText: {
    fontSize: 10,
    fontFamily: Platform.select(typography.heading),
    fontWeight: '700',
    letterSpacing: 0.6,
    textTransform: 'uppercase',
  },
  listContent: {
    paddingBottom: 110,
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
  fab: {
    position: 'absolute',
    width: 56,
    height: 56,
    borderRadius: 28,
    alignItems: 'center',
    justifyContent: 'center',
    shadowOpacity: 0.24,
    shadowRadius: 14,
    shadowOffset: {width: 0, height: 8},
    elevation: 10,
    overflow: 'hidden',
  },
  fabText: {
    color: '#FFFFFF',
    fontSize: 30,
    lineHeight: 32,
    marginTop: -1,
    fontFamily: Platform.select(typography.display),
    fontWeight: '700',
  },
});

export default HomeScreen;
