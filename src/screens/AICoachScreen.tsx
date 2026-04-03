import React, {useEffect, useMemo, useState} from 'react';
import {
  ActivityIndicator,
  Alert,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import {NativeStackScreenProps} from '@react-navigation/native-stack';
import AnimatedGradientBackground from '../components/AnimatedGradientBackground';
import GlassCard from '../components/GlassCard';
import {useSubjects} from '../context/SubjectsContext';
import {RootStackParamList} from '../navigation/types';
import {loadGeminiApiKey, saveGeminiApiKey} from '../storage/aiStorage';
import {darkPalette, lightPalette, typography} from '../theme';
import {AIMessage, CoachPlanResponse} from '../types';
import {notify} from '../utils/notify';
import {buildChatPrompt, buildCoachPrompt, parseCoachPlanResponse, requestGeminiText} from '../utils/gemini';

type Props = NativeStackScreenProps<RootStackParamList, 'AICoach'>;

const createMessageId = (role: 'user' | 'assistant') =>
  `${Date.now()}-${role}-${Math.random().toString(36).slice(2, 7)}`;

const AICoachScreen = ({route}: Props) => {
  const {records, isDarkMode} = useSubjects();
  const palette = isDarkMode ? darkPalette : lightPalette;
  const focusSubject = route.params?.focusSubject?.trim();

  const [apiKey, setApiKey] = useState('');
  const [savingKey, setSavingKey] = useState(false);
  const [contextInput, setContextInput] = useState('');
  const [coachOutput, setCoachOutput] = useState('');
  const [coachPlan, setCoachPlan] = useState<CoachPlanResponse | null>(null);
  const [loadingCoach, setLoadingCoach] = useState(false);

  const [chatInput, setChatInput] = useState('');
  const [messages, setMessages] = useState<AIMessage[]>([]);
  const [loadingChat, setLoadingChat] = useState(false);

  useEffect(() => {
    const hydrate = async () => {
      const key = await loadGeminiApiKey();
      setApiKey(key);
    };

    hydrate();
  }, []);

  useEffect(() => {
    if (focusSubject) {
      setContextInput(prev => {
        if (prev.toLowerCase().includes(focusSubject.toLowerCase())) {
          return prev;
        }
        return `Focus subject: ${focusSubject}. ${prev}`.trim();
      });
    }
  }, [focusSubject]);

  const scopedRecords = useMemo(() => {
    if (!focusSubject) {
      return records;
    }
    return records.filter(item => item.subjectName.toLowerCase() === focusSubject.toLowerCase());
  }, [focusSubject, records]);

  const overall = useMemo(() => {
    if (scopedRecords.length === 0) {
      return 0;
    }
    return scopedRecords.reduce((acc, record) => acc + record.percentage, 0) / scopedRecords.length;
  }, [scopedRecords]);

  const persistKey = async () => {
    if (!apiKey.trim()) {
      notify('Enter Gemini API key');
      return;
    }

    try {
      setSavingKey(true);
      await saveGeminiApiKey(apiKey);
      notify('API key saved');
    } finally {
      setSavingKey(false);
    }
  };

  const generatePlan = async () => {
    if (!apiKey.trim()) {
      notify('Add Gemini API key first');
      return;
    }

    if (scopedRecords.length === 0) {
      notify('No records available for this subject');
      return;
    }

    try {
      setLoadingCoach(true);
      const prompt = buildCoachPrompt(scopedRecords, contextInput);
      const text = await requestGeminiText({apiKey: apiKey.trim(), prompt});
      setCoachOutput(text);
      setCoachPlan(parseCoachPlanResponse(text));
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to generate plan';
      Alert.alert('AI Error', message);
    } finally {
      setLoadingCoach(false);
    }
  };

  const sendMessage = async () => {
    if (!chatInput.trim()) {
      return;
    }
    if (!apiKey.trim()) {
      notify('Add Gemini API key first');
      return;
    }

    const userMessage: AIMessage = {
      id: createMessageId('user'),
      role: 'user',
      text: chatInput.trim(),
      createdAt: new Date().toISOString(),
    };

    setMessages(prev => [...prev, userMessage]);
    setChatInput('');

    try {
      setLoadingChat(true);
      const prompt = buildChatPrompt(scopedRecords, userMessage.text);
      const aiText = await requestGeminiText({apiKey: apiKey.trim(), prompt});
      const aiMessage: AIMessage = {
        id: createMessageId('assistant'),
        role: 'assistant',
        text: aiText,
        createdAt: new Date().toISOString(),
      };
      setMessages(prev => [...prev, aiMessage]);
    } catch (error) {
      const message = error instanceof Error ? error.message : 'AI reply failed';
      Alert.alert('AI Error', message);
    } finally {
      setLoadingChat(false);
    }
  };

  const voiceNoteInfo = () => {
    Alert.alert(
      'Voice To AI',
      'Voice mode can be enabled with native speech-to-text package integration. For now, type your struggles/efforts and AI will respond as your digital faculty.',
    );
  };

  return (
    <View style={styles.container}>
      <AnimatedGradientBackground palette={palette} />
      <ScrollView contentContainerStyle={styles.content}>
        <Text style={[styles.overline, {color: palette.textSecondary}]}>AI Coach</Text>
        <Text style={[styles.title, {color: palette.textPrimary}]}>Digital Faculty</Text>
        <Text style={[styles.subtitle, {color: palette.textMuted}]}>Personalized suggestions, study plan, and timetable</Text>
        {!!focusSubject && (
          <View style={[styles.focusTag, {backgroundColor: palette.accentSoft}]}> 
            <Text style={[styles.focusTagText, {color: palette.accent}]}>Focus: {focusSubject}</Text>
          </View>
        )}

        <GlassCard palette={palette} style={styles.card}>
          <Text style={[styles.cardTitle, {color: palette.textPrimary}]}>Performance Summary</Text>
          <Text style={[styles.cardBody, {color: palette.textSecondary}]}>Subjects: {scopedRecords.length}</Text>
          <Text style={[styles.cardBody, {color: palette.textSecondary}]}>Overall average: {overall.toFixed(1)}%</Text>
        </GlassCard>

        <GlassCard palette={palette} style={styles.card}>
          <Text style={[styles.cardTitle, {color: palette.textPrimary}]}>Gemini API</Text>
          <TextInput
            value={apiKey}
            onChangeText={setApiKey}
            placeholder="Enter Gemini API key"
            placeholderTextColor={palette.textMuted}
            style={[styles.input, {borderColor: palette.cardBorder, color: palette.textPrimary, backgroundColor: palette.backgroundAlt}]}
            autoCapitalize="none"
          />
          <Pressable style={[styles.button, {backgroundColor: palette.accent}]} onPress={persistKey}>
            {savingKey ? (
              <ActivityIndicator color="#FFFFFF" />
            ) : (
              <Text style={styles.buttonText}>Save API Key</Text>
            )}
          </Pressable>
        </GlassCard>

        <GlassCard palette={palette} style={styles.card}>
          <Text style={[styles.cardTitle, {color: palette.textPrimary}]}>Suggestions + Study Plan + Timetable</Text>
          <TextInput
            value={contextInput}
            onChangeText={setContextInput}
            placeholder="Tell AI your struggles, effort level, exam timeline..."
            placeholderTextColor={palette.textMuted}
            multiline
            style={[
              styles.input,
              styles.multiline,
              {borderColor: palette.cardBorder, color: palette.textPrimary, backgroundColor: palette.backgroundAlt},
            ]}
          />
          <Pressable style={[styles.button, {backgroundColor: palette.accent}]} onPress={generatePlan}>
            {loadingCoach ? <ActivityIndicator color="#FFFFFF" /> : <Text style={styles.buttonText}>Generate Plan</Text>}
          </Pressable>
          {!!coachPlan && (
            <View style={styles.structuredWrap}>
              <View style={[styles.outputBox, {borderColor: palette.cardBorder, backgroundColor: palette.backgroundAlt}]}> 
                <Text style={[styles.outputHeading, {color: palette.textPrimary}]}>Summary</Text>
                <Text style={[styles.outputText, {color: palette.textPrimary}]}>{coachPlan.summary}</Text>
              </View>

              <View style={[styles.outputBox, {borderColor: palette.cardBorder, backgroundColor: palette.backgroundAlt}]}> 
                <Text style={[styles.outputHeading, {color: palette.textPrimary}]}>Subject Analysis</Text>
                <View style={[styles.tableHeaderRow, {borderColor: palette.cardBorder}]}> 
                  <Text style={[styles.tableHeaderCell, styles.subjectCell, {color: palette.textSecondary}]}>Subject</Text>
                  <Text style={[styles.tableHeaderCell, {color: palette.textSecondary}]}>Now</Text>
                  <Text style={[styles.tableHeaderCell, {color: palette.textSecondary}]}>Target</Text>
                </View>
                {coachPlan.subjectInsights.map(item => (
                  <View key={`${item.subject}-${item.currentPercent}`} style={[styles.tableRow, {borderColor: palette.cardBorder}]}> 
                    <View style={styles.subjectCell}>
                      <Text style={[styles.tableCellStrong, {color: palette.textPrimary}]}>{item.subject}</Text>
                      <Text style={[styles.tableSub, {color: palette.textMuted}]}>{item.weakAreas}</Text>
                    </View>
                    <Text style={[styles.tableCell, {color: palette.textPrimary}]}>{item.currentPercent}%</Text>
                    <Text style={[styles.tableCell, {color: palette.accent}]}>{item.targetPercent}%</Text>
                  </View>
                ))}
              </View>

              <View style={[styles.outputBox, {borderColor: palette.cardBorder, backgroundColor: palette.backgroundAlt}]}> 
                <Text style={[styles.outputHeading, {color: palette.textPrimary}]}>Priority Actions</Text>
                {coachPlan.priorityActions.length === 0 ? (
                  <Text style={[styles.outputText, {color: palette.textMuted}]}>No priority actions generated yet.</Text>
                ) : (
                  coachPlan.priorityActions.map((action, index) => (
                    <View
                      key={`${action}-${index}`}
                      style={[
                        styles.planStepCard,
                        {borderColor: palette.cardBorder, backgroundColor: palette.card},
                      ]}>
                      <View style={[styles.planStepBadge, {backgroundColor: palette.accentSoft}]}> 
                        <Text style={[styles.planStepBadgeText, {color: palette.accent}]}>{index + 1}</Text>
                      </View>
                      <Text style={[styles.planStepText, {color: palette.textPrimary}]}>{action}</Text>
                    </View>
                  ))
                )}
              </View>

              <View style={[styles.outputBox, {borderColor: palette.cardBorder, backgroundColor: palette.backgroundAlt}]}> 
                <Text style={[styles.outputHeading, {color: palette.textPrimary}]}>Weekly Plan (Execution)</Text>
                {coachPlan.weeklyPlan.length === 0 ? (
                  <Text style={[styles.outputText, {color: palette.textMuted}]}>No weekly plan steps generated yet.</Text>
                ) : (
                  coachPlan.weeklyPlan.map((step, index) => (
                    <View
                      key={`${step}-${index}`}
                      style={[
                        styles.planStepCard,
                        {borderColor: palette.cardBorder, backgroundColor: palette.card},
                      ]}>
                      <View style={[styles.planStepBadge, {backgroundColor: palette.accentSoft}]}> 
                        <Text style={[styles.planStepBadgeText, {color: palette.accent}]}>P{index + 1}</Text>
                      </View>
                      <Text style={[styles.planStepText, {color: palette.textPrimary}]}>{step}</Text>
                    </View>
                  ))
                )}
              </View>

              <View style={[styles.outputBox, {borderColor: palette.cardBorder, backgroundColor: palette.backgroundAlt}]}> 
                <Text style={[styles.outputHeading, {color: palette.textPrimary}]}>Timetable</Text>
                {coachPlan.timetable.map(slot => (
                  <View key={`${slot.day}-${slot.start}-${slot.task}`} style={[styles.timetableRow, {borderColor: palette.cardBorder}]}> 
                    <View style={styles.timetableLeft}>
                      <Text style={[styles.tableCellStrong, {color: palette.textPrimary}]}>{slot.day}</Text>
                      <Text style={[styles.tableSub, {color: palette.textMuted}]}>{slot.start} - {slot.end}</Text>
                    </View>
                    <Text style={[styles.timetableTask, {color: palette.textPrimary}]}>{slot.task}</Text>
                  </View>
                ))}
              </View>

              <View style={[styles.outputBox, {borderColor: palette.cardBorder, backgroundColor: palette.backgroundAlt}]}> 
                <Text style={[styles.outputHeading, {color: palette.textPrimary}]}>Motivation</Text>
                <Text style={[styles.outputText, {color: palette.textPrimary}]}>{coachPlan.motivation}</Text>
              </View>
            </View>
          )}

          {!coachPlan && !!coachOutput && (
            <View style={[styles.outputBox, {borderColor: palette.cardBorder, backgroundColor: palette.backgroundAlt}]}> 
              <Text style={[styles.outputText, {color: palette.textPrimary}]}>{coachOutput}</Text>
            </View>
          )}
        </GlassCard>

        <GlassCard palette={palette} style={styles.card}>
          <View style={styles.chatHeaderRow}>
            <Text style={[styles.cardTitle, {color: palette.textPrimary}]}>Speak To AI Mentor</Text>
            <Pressable onPress={voiceNoteInfo}>
              <Text style={[styles.voiceHint, {color: palette.accent}]}>Voice Help</Text>
            </Pressable>
          </View>
          <TextInput
            value={chatInput}
            onChangeText={setChatInput}
            placeholder="Share your current academic situation..."
            placeholderTextColor={palette.textMuted}
            multiline
            style={[
              styles.input,
              styles.multiline,
              {borderColor: palette.cardBorder, color: palette.textPrimary, backgroundColor: palette.backgroundAlt},
            ]}
          />
          <Pressable style={[styles.button, {backgroundColor: palette.accent}]} onPress={sendMessage}>
            {loadingChat ? <ActivityIndicator color="#FFFFFF" /> : <Text style={styles.buttonText}>Send to AI</Text>}
          </Pressable>

          <View style={styles.messagesWrap}>
            {messages.map(item => (
              <View
                key={item.id}
                style={[
                  styles.message,
                  item.role === 'assistant' ? styles.messageAssistant : styles.messageUser,
                  {
                    borderColor: palette.cardBorder,
                    backgroundColor: item.role === 'assistant' ? palette.accentSoft : palette.backgroundAlt,
                  },
                ]}>
                <Text style={[styles.messageRole, {color: palette.textSecondary}]}> 
                  {item.role === 'assistant' ? 'AI Mentor' : 'You'}
                </Text>
                <Text style={[styles.messageText, {color: palette.textPrimary}]}>{item.text}</Text>
              </View>
            ))}
          </View>
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
  focusTag: {
    alignSelf: 'flex-start',
    borderRadius: 999,
    paddingHorizontal: 12,
    paddingVertical: 6,
    marginBottom: 12,
  },
  focusTagText: {
    fontSize: 12,
    fontFamily: Platform.select(typography.heading),
    fontWeight: '700',
    letterSpacing: 0.4,
    textTransform: 'uppercase',
  },
  card: {
    marginBottom: 12,
  },
  cardTitle: {
    fontSize: 16,
    fontFamily: Platform.select(typography.heading),
    fontWeight: '700',
    marginBottom: 8,
  },
  cardBody: {
    fontSize: 14,
    fontFamily: Platform.select(typography.body),
    marginBottom: 4,
  },
  input: {
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 14,
    fontFamily: Platform.select(typography.body),
    marginBottom: 8,
  },
  multiline: {
    minHeight: 94,
    textAlignVertical: 'top',
  },
  button: {
    borderRadius: 12,
    paddingVertical: 11,
    alignItems: 'center',
    justifyContent: 'center',
  },
  buttonText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontFamily: Platform.select(typography.heading),
    fontWeight: '700',
    letterSpacing: 0.5,
    textTransform: 'uppercase',
  },
  outputBox: {
    marginTop: 10,
    borderWidth: 1,
    borderRadius: 12,
    padding: 12,
  },
  outputText: {
    fontSize: 14,
    fontFamily: Platform.select(typography.body),
    lineHeight: 21,
  },
  structuredWrap: {
    marginTop: 10,
    gap: 10,
  },
  outputHeading: {
    fontSize: 13,
    fontFamily: Platform.select(typography.heading),
    fontWeight: '700',
    marginBottom: 6,
    textTransform: 'uppercase',
  },
  tableHeaderRow: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    paddingBottom: 6,
    marginBottom: 2,
  },
  tableHeaderCell: {
    flex: 0.7,
    fontSize: 11,
    fontFamily: Platform.select(typography.heading),
    fontWeight: '700',
    textTransform: 'uppercase',
  },
  tableRow: {
    flexDirection: 'row',
    paddingVertical: 8,
    borderBottomWidth: 1,
  },
  subjectCell: {
    flex: 1.8,
    paddingRight: 6,
  },
  tableCellStrong: {
    fontSize: 13,
    fontFamily: Platform.select(typography.heading),
    fontWeight: '700',
  },
  tableSub: {
    marginTop: 2,
    fontSize: 12,
    fontFamily: Platform.select(typography.body),
  },
  tableCell: {
    flex: 0.7,
    fontSize: 13,
    fontFamily: Platform.select(typography.body),
    fontWeight: '600',
  },
  planStepCard: {
    marginBottom: 8,
    borderWidth: 1,
    borderRadius: 10,
    paddingVertical: 8,
    paddingHorizontal: 10,
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 8,
  },
  planStepBadge: {
    minWidth: 28,
    height: 24,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 6,
  },
  planStepBadgeText: {
    fontSize: 11,
    fontFamily: Platform.select(typography.heading),
    fontWeight: '800',
  },
  planStepText: {
    flex: 1,
    fontSize: 14,
    fontFamily: Platform.select(typography.body),
    lineHeight: 20,
  },
  timetableRow: {
    borderWidth: 1,
    borderRadius: 10,
    padding: 8,
    marginBottom: 6,
    flexDirection: 'row',
    gap: 8,
    alignItems: 'center',
  },
  timetableLeft: {
    width: 110,
  },
  timetableTask: {
    flex: 1,
    fontSize: 13,
    fontFamily: Platform.select(typography.body),
    fontWeight: '600',
  },
  chatHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  voiceHint: {
    fontSize: 12,
    fontFamily: Platform.select(typography.heading),
    fontWeight: '700',
  },
  messagesWrap: {
    marginTop: 10,
    gap: 8,
  },
  message: {
    maxWidth: '88%',
    borderWidth: 1,
    borderRadius: 12,
    padding: 10,
  },
  messageAssistant: {
    alignSelf: 'flex-start',
  },
  messageUser: {
    alignSelf: 'flex-end',
  },
  messageRole: {
    fontSize: 11,
    fontFamily: Platform.select(typography.heading),
    fontWeight: '700',
    marginBottom: 4,
    textTransform: 'uppercase',
  },
  messageText: {
    fontSize: 14,
    fontFamily: Platform.select(typography.body),
    lineHeight: 20,
  },
});

export default AICoachScreen;
