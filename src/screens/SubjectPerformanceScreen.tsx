import React, {useMemo} from 'react';
import {Platform, Pressable, ScrollView, StyleSheet, Text, View} from 'react-native';
import {NativeStackScreenProps} from '@react-navigation/native-stack';
import AnimatedGradientBackground from '../components/AnimatedGradientBackground';
import GlassCard from '../components/GlassCard';
import {useSubjects} from '../context/SubjectsContext';
import {RootStackParamList} from '../navigation/types';
import {darkPalette, lightPalette, typography} from '../theme';

type Props = NativeStackScreenProps<RootStackParamList, 'SubjectPerformance'>;

const WEAK_SUBJECT_THRESHOLD = 60;

const SubjectPerformanceScreen = ({navigation, route}: Props) => {
  const {records, isDarkMode} = useSubjects();
  const palette = isDarkMode ? darkPalette : lightPalette;
  const subjectName = route.params.subjectName;

  const scopedRecords = useMemo(
    () =>
      records
        .filter(item => item.subjectName.toLowerCase() === subjectName.toLowerCase())
        .sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()),
    [records, subjectName],
  );

  const module1Latest = useMemo(
    () => scopedRecords.find(item => item.module === 'Module 1'),
    [scopedRecords],
  );

  const module2Latest = useMemo(
    () => scopedRecords.find(item => item.module === 'Module 2'),
    [scopedRecords],
  );

  const latest = scopedRecords[0];
  const isWeak = latest ? latest.percentage < WEAK_SUBJECT_THRESHOLD : false;

  const trend = useMemo(() => {
    if (!module1Latest || !module2Latest) {
      return null;
    }

    const delta = Number((module2Latest.percentage - module1Latest.percentage).toFixed(2));
    const direction = delta > 0 ? 'improved' : delta < 0 ? 'decreased' : 'same';

    return {
      delta,
      direction,
    };
  }, [module1Latest, module2Latest]);

  const trendColor = trend
    ? trend.direction === 'improved'
      ? palette.success
      : trend.direction === 'decreased'
      ? palette.danger
      : palette.warning
    : palette.textSecondary;

  return (
    <View style={styles.container}>
      <AnimatedGradientBackground palette={palette} />
      <ScrollView contentContainerStyle={styles.content}>
        <Pressable
          style={[styles.backBtn, {borderColor: palette.cardBorder, backgroundColor: palette.backgroundAlt}]}
          onPress={() => navigation.goBack()}>
          <Text style={[styles.backText, {color: palette.textPrimary}]}>Back</Text>
        </Pressable>

        <Text style={[styles.overline, {color: palette.textSecondary}]}>Subject Details</Text>
        <Text style={[styles.title, {color: palette.textPrimary}]}>{subjectName}</Text>

        {!!latest && (
          <GlassCard palette={palette} style={styles.card}>
            <View style={styles.headRow}>
              <Text style={[styles.cardTitle, {color: palette.textPrimary}]}>Current Performance</Text>
              {isWeak ? (
                <View style={[styles.weakChip, {backgroundColor: 'rgba(220, 38, 38, 0.12)'}]}>
                  <Text style={[styles.weakChipText, {color: palette.danger}]}>Coach Recommended</Text>
                </View>
              ) : (
                <View style={[styles.goodChip, {backgroundColor: 'rgba(34, 197, 94, 0.12)'}]}>
                  <Text style={[styles.goodChipText, {color: palette.success}]}>Good Standing</Text>
                </View>
              )}
            </View>
            <Text style={[styles.metric, {color: palette.textPrimary}]}>{latest.percentage.toFixed(2)}%</Text>
            <Text style={[styles.meta, {color: palette.textSecondary}]}>Total: {latest.total.toFixed(2)} / 60 ({latest.module})</Text>

            {isWeak && (
              <Pressable
                style={[styles.coachBtn, {backgroundColor: palette.accent}]}
                onPress={() => navigation.navigate('AICoach', {focusSubject: subjectName})}>
                <Text style={styles.coachBtnText}>Open AI Coach For This Subject</Text>
              </Pressable>
            )}
          </GlassCard>
        )}

        <GlassCard palette={palette} style={styles.card}>
          <Text style={[styles.cardTitle, {color: palette.textPrimary}]}>Module Comparison</Text>
          <View style={[styles.row, {borderColor: palette.cardBorder}]}> 
            <Text style={[styles.cellLabel, {color: palette.textSecondary}]}>Module 1</Text>
            <Text style={[styles.cellValue, {color: palette.textPrimary}]}>
              {module1Latest ? `${module1Latest.percentage.toFixed(2)}%` : 'No data'}
            </Text>
          </View>
          <View style={[styles.row, {borderColor: palette.cardBorder}]}> 
            <Text style={[styles.cellLabel, {color: palette.textSecondary}]}>Module 2</Text>
            <Text style={[styles.cellValue, {color: palette.textPrimary}]}>
              {module2Latest ? `${module2Latest.percentage.toFixed(2)}%` : 'No data'}
            </Text>
          </View>

          {trend ? (
            <View style={[styles.trendBox, {backgroundColor: palette.backgroundAlt, borderColor: palette.cardBorder}]}> 
              <Text style={[styles.trendTitle, {color: palette.textPrimary}]}>Performance Change</Text>
              <Text style={[styles.trendValue, {color: trendColor}]}>
                {trend.delta > 0 ? '+' : ''}
                {trend.delta.toFixed(2)}%
              </Text>
              <Text style={[styles.meta, {color: palette.textSecondary}]}>From Module 1 to Module 2 ({trend.direction})</Text>
            </View>
          ) : (
            <Text style={[styles.meta, {color: palette.textMuted}]}>Add both Module 1 and Module 2 entries to see improvement/decrease.</Text>
          )}
        </GlassCard>

        <GlassCard palette={palette} style={styles.card}>
          <Text style={[styles.cardTitle, {color: palette.textPrimary}]}>Record History</Text>
          {scopedRecords.map(item => (
            <View key={item.id} style={[styles.historyRow, {borderColor: palette.cardBorder}]}> 
              <View>
                <Text style={[styles.historyModule, {color: palette.textPrimary}]}>{item.module}</Text>
                <Text style={[styles.historyDate, {color: palette.textMuted}]}>
                  {new Date(item.updatedAt).toLocaleDateString()}
                </Text>
              </View>
              <Text style={[styles.historyPercent, {color: palette.textPrimary}]}>{item.percentage.toFixed(2)}%</Text>
            </View>
          ))}
          {scopedRecords.length === 0 && (
            <Text style={[styles.meta, {color: palette.textMuted}]}>No records found for this subject.</Text>
          )}
        </GlassCard>
      </ScrollView>
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
    paddingBottom: 40,
  },
  backBtn: {
    alignSelf: 'flex-start',
    borderWidth: 1,
    borderRadius: 999,
    paddingHorizontal: 14,
    paddingVertical: 8,
    marginBottom: 12,
  },
  backText: {
    fontSize: 12,
    fontFamily: Platform.select(typography.heading),
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.6,
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
    marginBottom: 10,
    fontSize: 30,
    fontFamily: Platform.select(typography.display),
    fontWeight: '700',
  },
  card: {
    marginBottom: 12,
  },
  headRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: 8,
  },
  cardTitle: {
    fontSize: 16,
    fontFamily: Platform.select(typography.heading),
    fontWeight: '700',
  },
  weakChip: {
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 5,
  },
  weakChipText: {
    fontSize: 11,
    fontFamily: Platform.select(typography.heading),
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.4,
  },
  goodChip: {
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 5,
  },
  goodChipText: {
    fontSize: 11,
    fontFamily: Platform.select(typography.heading),
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.4,
  },
  metric: {
    marginTop: 10,
    fontSize: 34,
    fontFamily: Platform.select(typography.display),
    fontWeight: '700',
  },
  meta: {
    marginTop: 4,
    fontSize: 13,
    fontFamily: Platform.select(typography.body),
    lineHeight: 20,
  },
  coachBtn: {
    marginTop: 12,
    borderRadius: 12,
    paddingVertical: 11,
    alignItems: 'center',
  },
  coachBtnText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontFamily: Platform.select(typography.heading),
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.4,
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderBottomWidth: 1,
    paddingVertical: 8,
  },
  cellLabel: {
    fontSize: 13,
    fontFamily: Platform.select(typography.heading),
    fontWeight: '600',
  },
  cellValue: {
    fontSize: 14,
    fontFamily: Platform.select(typography.body),
    fontWeight: '700',
  },
  trendBox: {
    marginTop: 10,
    borderWidth: 1,
    borderRadius: 12,
    padding: 10,
  },
  trendTitle: {
    fontSize: 13,
    fontFamily: Platform.select(typography.heading),
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.4,
  },
  trendValue: {
    marginTop: 6,
    fontSize: 24,
    fontFamily: Platform.select(typography.display),
    fontWeight: '700',
  },
  historyRow: {
    borderWidth: 1,
    borderRadius: 12,
    padding: 10,
    marginTop: 8,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  historyModule: {
    fontSize: 14,
    fontFamily: Platform.select(typography.heading),
    fontWeight: '700',
  },
  historyDate: {
    marginTop: 2,
    fontSize: 12,
    fontFamily: Platform.select(typography.body),
  },
  historyPercent: {
    fontSize: 18,
    fontFamily: Platform.select(typography.heading),
    fontWeight: '700',
  },
});

export default SubjectPerformanceScreen;
