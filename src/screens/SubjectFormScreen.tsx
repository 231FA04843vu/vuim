import React, {useEffect, useMemo, useState} from 'react';
import {Platform, Pressable, ScrollView, StyleSheet, Text, View} from 'react-native';
import {NativeStackScreenProps} from '@react-navigation/native-stack';
import {useSafeAreaInsets} from 'react-native-safe-area-context';
import {Picker} from '@react-native-picker/picker';
import AnimatedGradientBackground from '../components/AnimatedGradientBackground';
import AnimatedInput from '../components/AnimatedInput';
import GlassCard from '../components/GlassCard';
import AnimatedProgressBar from '../components/AnimatedProgressBar';
import {useSubjects} from '../context/SubjectsContext';
import {RootStackParamList} from '../navigation/types';
import {darkPalette, lightPalette, typography} from '../theme';
import {ModuleType, SubjectMarksInput} from '../types';
import {calculateInternalMarks} from '../utils/calculate';
import {notify} from '../utils/notify';
import HamburgerButton from '../components/HamburgerButton';
import SideDrawerMenu from '../components/SideDrawerMenu';

type Props = NativeStackScreenProps<RootStackParamList, 'SubjectForm'>;

const emptyMarks: SubjectMarksInput = {
  pret1: 0,
  t1: 0,
  t2: 0,
  t3: 0,
  t4: 0,
  cla1: 0,
  cla2: 0,
  cla3: 0,
  cla4: 0,
};

const MARK_LIMITS: Record<keyof SubjectMarksInput, number> = {
  pret1: 10,
  t1: 20,
  t2: 5,
  t3: 5,
  t4: 20,
  cla1: 20,
  cla2: 20,
  cla3: 20,
  cla4: 20,
};

const parseClampedMark = (value: string, max: number) => {
  const digitsOnly = value.replace(/[^\d]/g, '');
  if (!digitsOnly) {
    return 0;
  }

  const parsed = Number(digitsOnly);
  if (Number.isNaN(parsed)) {
    return 0;
  }

  return Math.min(parsed, max);
};

const normalizeSubjectName = (value: string) => {
  const lettersOnly = value.replace(/[^A-Za-z\s]/g, '').replace(/\s+/g, ' ').trimStart();
  return lettersOnly
    .split(' ')
    .filter(Boolean)
    .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
    .join(' ');
};

const SubjectFormScreen = ({navigation, route}: Props) => {
  const insets = useSafeAreaInsets();
  const {addRecord, updateRecord, findRecordById, isDarkMode} = useSubjects();
  const palette = isDarkMode ? darkPalette : lightPalette;

  const editId = route.params?.recordId;
  const record = editId ? findRecordById(editId) : undefined;

  const [subjectName, setSubjectName] = useState(record?.subjectName ?? '');
  const [module, setModule] = useState<ModuleType>(record?.module ?? 'Module 1');
  const [marks, setMarks] = useState<SubjectMarksInput>(record?.marks ?? emptyMarks);
  const [menuVisible, setMenuVisible] = useState(false);

  useEffect(() => {
    navigation.setOptions({
      title: record ? 'Edit Subject' : 'Add Subject',
    });
  }, [navigation, record]);

  const result = useMemo(() => calculateInternalMarks(marks), [marks]);

  const setField = (key: keyof SubjectMarksInput, value: string) => {
    const maxAllowed = MARK_LIMITS[key];
    setMarks(prev => ({
      ...prev,
      [key]: parseClampedMark(value, maxAllowed),
    }));
  };

  const save = async () => {
    const cleanSubjectName = normalizeSubjectName(subjectName).trim();

    if (!cleanSubjectName) {
      notify('Enter subject name');
      return;
    }

    const payload = {
      subjectName: cleanSubjectName,
      module,
      marks,
    };

    if (record) {
      await updateRecord(record.id, payload);
      notify('Record updated');
    } else {
      await addRecord(payload);
      notify('Record saved');
      setSubjectName('');
      setModule('Module 1');
      setMarks(emptyMarks);
    }

    navigation.navigate('Home');
  };

  return (
    <View style={styles.container}>
      <AnimatedGradientBackground palette={palette} />
      <ScrollView contentContainerStyle={[styles.content, {paddingTop: Math.max(18, insets.top + 8)}]}>
        <View style={styles.topRow}>
          <HamburgerButton palette={palette} isDarkMode={isDarkMode} onPress={() => setMenuVisible(true)} />
          <View>
            <Text style={[styles.overline, {color: palette.textSecondary}]}>Editor</Text>
            <Text style={[styles.pageTitle, {color: palette.textPrimary}]}>
              {record ? 'Update Subject' : 'New Subject'}
            </Text>
            <Text style={[styles.subtitle, {color: palette.textMuted}]}>Enter marks quickly and review totals instantly</Text>
          </View>
        </View>
        <GlassCard palette={palette}>
          <Text style={[styles.heading, {color: palette.textPrimary}]}>Academic Details</Text>

          <AnimatedInput
            label="Subject Name"
            value={subjectName}
            onChangeText={value => setSubjectName(normalizeSubjectName(value))}
            palette={palette}
            placeholder="E.g. Digital Logic Design"
          />

          <Text style={[styles.label, {color: palette.textSecondary}]}>Module</Text>
          <View style={[styles.pickerBox, {borderColor: palette.cardBorder, backgroundColor: palette.backgroundAlt}]}> 
            <Picker selectedValue={module} onValueChange={value => setModule(value as ModuleType)}>
              <Picker.Item label="Module 1" value="Module 1" />
              <Picker.Item label="Module 2" value="Module 2" />
            </Picker>
          </View>

          <Text style={[styles.sectionTitle, {color: palette.textPrimary}]}>Marks</Text>
          <AnimatedInput
            label="Pre-T1 (out of 10)"
            keyboardType="numeric"
            value={String(marks.pret1)}
            onChangeText={value => setField('pret1', value)}
            palette={palette}
          />
          <AnimatedInput
            label="T1 (out of 20)"
            keyboardType="numeric"
            value={String(marks.t1)}
            onChangeText={value => setField('t1', value)}
            palette={palette}
          />
          <AnimatedInput
            label="T2 (out of 5)"
            keyboardType="numeric"
            value={String(marks.t2)}
            onChangeText={value => setField('t2', value)}
            palette={palette}
          />
          <AnimatedInput
            label="T3 (out of 5)"
            keyboardType="numeric"
            value={String(marks.t3)}
            onChangeText={value => setField('t3', value)}
            palette={palette}
          />
          <AnimatedInput
            label="T4 (out of 20)"
            keyboardType="numeric"
            value={String(marks.t4)}
            onChangeText={value => setField('t4', value)}
            palette={palette}
          />
          <AnimatedInput
            label="CLA-1 (out of 20)"
            keyboardType="numeric"
            value={String(marks.cla1)}
            onChangeText={value => setField('cla1', value)}
            palette={palette}
          />
          <AnimatedInput
            label="CLA-2 (out of 20)"
            keyboardType="numeric"
            value={String(marks.cla2)}
            onChangeText={value => setField('cla2', value)}
            palette={palette}
          />
          <AnimatedInput
            label="CLA-3 (out of 20)"
            keyboardType="numeric"
            value={String(marks.cla3)}
            onChangeText={value => setField('cla3', value)}
            palette={palette}
          />
          <AnimatedInput
            label="CLA-4 (out of 20)"
            keyboardType="numeric"
            value={String(marks.cla4)}
            onChangeText={value => setField('cla4', value)}
            palette={palette}
          />

          <View style={[styles.resultBox, {backgroundColor: palette.accentSoft}]}> 
            <Text style={[styles.resultTitle, {color: palette.textPrimary}]}>Result</Text>
            <Text style={[styles.resultText, {color: palette.textSecondary}]}> 
              Total: {result.total.toFixed(2)} / 60
            </Text>
            <Text style={[styles.resultText, {color: palette.textSecondary}]}> 
              Percentage: {result.percentage.toFixed(2)}%
            </Text>
            <View style={styles.progressGap}>
              <AnimatedProgressBar percentage={result.percentage} palette={palette} />
            </View>
          </View>

          <Pressable
            style={[styles.saveButton, {backgroundColor: palette.accent}]}
            onPress={save}
            android_ripple={{color: 'rgba(255,255,255,0.28)'}}>
            <Text style={styles.saveButtonText}>{record ? 'Update Subject' : 'Save Subject'}</Text>
          </Pressable>
        </GlassCard>
      </ScrollView>
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
  content: {
    paddingHorizontal: 20,
    paddingBottom: 44,
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
  pageTitle: {
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
  heading: {
    fontSize: 20,
    fontFamily: Platform.select(typography.heading),
    fontWeight: '700',
    marginBottom: 16,
  },
  label: {
    fontSize: 11,
    fontFamily: Platform.select(typography.heading),
    fontWeight: '700',
    marginBottom: 8,
    letterSpacing: 0.7,
    textTransform: 'uppercase',
  },
  pickerBox: {
    borderRadius: 14,
    borderWidth: 1,
    marginBottom: 16,
    overflow: 'hidden',
  },
  sectionTitle: {
    fontSize: 17,
    fontFamily: Platform.select(typography.heading),
    fontWeight: '700',
    marginBottom: 12,
    marginTop: 8,
  },
  resultBox: {
    marginTop: 8,
    marginBottom: 18,
    borderRadius: 18,
    padding: 14,
  },
  resultTitle: {
    fontSize: 17,
    fontFamily: Platform.select(typography.heading),
    fontWeight: '700',
    marginBottom: 6,
  },
  resultText: {
    fontSize: 15,
    fontFamily: Platform.select(typography.body),
    marginBottom: 4,
    fontWeight: '600',
  },
  progressGap: {
    marginTop: 12,
  },
  saveButton: {
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 15,
    overflow: 'hidden',
    shadowColor: '#000000',
    shadowOpacity: 0.2,
    shadowRadius: 12,
    shadowOffset: {width: 0, height: 5},
    elevation: 6,
  },
  saveButtonText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontFamily: Platform.select(typography.heading),
    fontWeight: '800',
    letterSpacing: 0.6,
    textTransform: 'uppercase',
  },
});

export default SubjectFormScreen;
