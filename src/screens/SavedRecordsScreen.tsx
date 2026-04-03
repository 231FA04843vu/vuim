import React, {useMemo, useState} from 'react';
import {Alert, FlatList, Platform, StyleSheet, Text, View} from 'react-native';
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

type Props = NativeStackScreenProps<RootStackParamList, 'SavedRecords'>;
const WEAK_SUBJECT_THRESHOLD = 60;

const SavedRecordsScreen = ({navigation}: Props) => {
  const insets = useSafeAreaInsets();
  const {records, deleteRecord, isDarkMode} = useSubjects();
  const palette = isDarkMode ? darkPalette : lightPalette;
  const [query, setQuery] = useState('');
  const [menuVisible, setMenuVisible] = useState(false);

  const filtered = useMemo(
    () =>
      records
        .filter(item => item.subjectName.toLowerCase().includes(query.trim().toLowerCase()))
        .sort((a, b) => b.total - a.total),
    [query, records],
  );

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
            <Text style={[styles.overline, {color: palette.textSecondary}]}>Archive</Text>
            <Text style={[styles.title, {color: palette.textPrimary}]}>Saved Subjects</Text>
            <Text style={[styles.subtitle, {color: palette.textMuted}]}>Browse history and quickly compare outcomes</Text>
          </View>
        </View>

        <GlassCard palette={palette} style={styles.infoCard}>
          <Text style={[styles.infoTitle, {color: palette.textPrimary}]}>Track and Compare</Text>
          <Text style={[styles.infoText, {color: palette.textSecondary}]}>Search any subject and review performance history quickly.</Text>
        </GlassCard>
        <AnimatedInput
          label="Search"
          value={query}
          onChangeText={setQuery}
          palette={palette}
          placeholder="Find by subject"
        />

        <FlatList
          data={filtered}
          keyExtractor={item => item.id}
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
            <View style={[styles.emptyWrap, {borderColor: palette.cardBorder, backgroundColor: palette.card}]}> 
              <Text style={[styles.emptyTitle, {color: palette.textPrimary}]}>No records found</Text>
              <Text style={[styles.empty, {color: palette.textSecondary}]}>Start by adding a subject from the dashboard.</Text>
            </View>
          }
        />
      </View>
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
  },
  subtitle: {
    marginTop: 6,
    fontSize: 14,
    fontFamily: Platform.select(typography.body),
    fontWeight: '500',
    lineHeight: 20,
  },
  infoCard: {
    marginBottom: 14,
  },
  infoTitle: {
    fontSize: 17,
    fontFamily: Platform.select(typography.heading),
    fontWeight: '700',
    lineHeight: 22,
  },
  infoText: {
    marginTop: 6,
    fontSize: 14,
    fontFamily: Platform.select(typography.body),
    lineHeight: 21,
  },
  listContent: {
    paddingBottom: 44,
  },
  emptyWrap: {
    marginTop: 20,
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
  empty: {
    fontSize: 15,
    fontFamily: Platform.select(typography.body),
    lineHeight: 22,
  },
});

export default SavedRecordsScreen;
