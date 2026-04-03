import React, {useEffect, useMemo, useState} from 'react';
import {
  ActivityIndicator,
  Alert,
  FlatList,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import {NativeStackScreenProps} from '@react-navigation/native-stack';
import AnimatedGradientBackground from '../components/AnimatedGradientBackground';
import GlassCard from '../components/GlassCard';
import {useNotifications} from '../context/NotificationsContext';
import {useSubjects} from '../context/SubjectsContext';
import {RootStackParamList} from '../navigation/types';
import {
  clearAiChatSession,
  clearAiPlanSnapshot,
  clearAiTasks,
  clearAiTimetable,
  loadAiChatSession,
  loadAiPlanSnapshot,
  loadAiTimetable,
  loadGeminiApiKey,
  saveAiChatSession,
  saveAiPlanSnapshot,
  saveAiTasks,
  saveAiTimetable,
} from '../storage/aiStorage';
import {darkPalette, lightPalette, typography} from '../theme';
import {AIMessage, AITask, CoachTimeBlock} from '../types';
import {notify} from '../utils/notify';
import {buildMentorPrompt, extractPlanTasksFromText, extractTimetableFromMentorResponse, requestGeminiText} from '../utils/gemini';
import {
  clearScheduledPlanNotifications,
  clearScheduledStudyNotifications,
  schedulePlanTaskNotifications,
  scheduleStudyNotifications,
} from '../utils/mobileNotifications';

type Props = NativeStackScreenProps<RootStackParamList, 'AICoach'>;

const buildFallbackTimetable = (tasks: string[]): CoachTimeBlock[] => {
  const days = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri'];
  const slots = [
    {start: '06:30', end: '07:30'},
    {start: '18:30', end: '19:30'},
  ];

  const cleanTasks = tasks.filter(Boolean).slice(0, 6);
  if (cleanTasks.length === 0) {
    return [];
  }

  return cleanTasks.map((task, index) => {
    const day = days[index % days.length];
    const time = slots[index % slots.length];
    return {
      day,
      start: time.start,
      end: time.end,
      task,
    };
  });
};

const toTimestamp = (value: string) => {
  const parsed = Date.parse(value);
  return Number.isNaN(parsed) ? 0 : parsed;
};

const normalizeChatOrder = (items: AIMessage[]) => {
  return [...items].sort((a, b) => toTimestamp(a.createdAt) - toTimestamp(b.createdAt));
};

const AICoachScreen = ({route}: Props) => {
  const {records, isDarkMode} = useSubjects();
  const {addNotification} = useNotifications();
  const palette = isDarkMode ? darkPalette : lightPalette;
  const focusSubject = route.params?.focusSubject?.trim();
  const messagesRef = React.useRef<AIMessage[]>([]);
  const chatListRef = React.useRef<FlatList<AIMessage>>(null);

  const [apiKey, setApiKey] = useState('');
  const [chatInput, setChatInput] = useState('');
  const [messages, setMessages] = useState<AIMessage[]>([]);
  const [loadingChat, setLoadingChat] = useState(false);
  const [timetable, setTimetable] = useState<CoachTimeBlock[]>([]);
  const [savedPlan, setSavedPlan] = useState('');

  useEffect(() => {
    messagesRef.current = messages;
  }, [messages]);

  useEffect(() => {
    const hydrate = async () => {
      const [key, storedTimetable, storedMessages, storedPlan] = await Promise.all([
        loadGeminiApiKey(),
        loadAiTimetable(),
        loadAiChatSession(),
        loadAiPlanSnapshot(),
      ]);
      setApiKey(key);
      setTimetable(storedTimetable);
      setMessages(normalizeChatOrder(storedMessages));
      setSavedPlan(storedPlan);
    };

    hydrate();
  }, []);

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

  const sendMessage = async () => {
    if (!chatInput.trim()) {
      return;
    }
    if (!apiKey.trim()) {
      notify('AI service is not configured right now');
      return;
    }

    const history = messagesRef.current;

    const userMessage: AIMessage = {
      id: `${Date.now()}-user`,
      role: 'user',
      text: chatInput.trim(),
      createdAt: new Date().toISOString(),
    };

    const nextMessages = [...history, userMessage];
    setMessages(nextMessages);
    await saveAiChatSession(nextMessages);
    setChatInput('');

    try {
      setLoadingChat(true);
      const prompt = buildMentorPrompt(scopedRecords, userMessage.text, history);
      const aiText = await requestGeminiText({apiKey: apiKey.trim(), prompt});
      const parsed = extractTimetableFromMentorResponse(aiText);
      const aiMessage: AIMessage = {
        id: `${Date.now()}-ai`,
        role: 'assistant',
        text: parsed.cleanText,
        createdAt: new Date().toISOString(),
      };
      const nextWithAi = [...nextMessages, aiMessage];
      setMessages(nextWithAi);
      await saveAiChatSession(nextWithAi);

      const askedForPlan = /\b(plan|study plan|strategy|roadmap|timetable|schedule)\b/i.test(userMessage.text);
      if (askedForPlan) {
        await saveAiPlanSnapshot(parsed.cleanText);
        setSavedPlan(parsed.cleanText);

        const textTasks = extractPlanTasksFromText(parsed.cleanText);
        const effectiveTimetable = parsed.timetable.length > 0 ? parsed.timetable : buildFallbackTimetable(textTasks);
        const timetableTasks = effectiveTimetable.map(
          (slot: CoachTimeBlock) => `${slot.day} ${slot.start} ${slot.task}`,
        );
        const merged = [...textTasks, ...timetableTasks].slice(0, 8);
        const taskObjects: AITask[] = merged.map((title, index) => ({
          id: `${Date.now()}-${index}`,
          title,
          createdAt: new Date().toISOString(),
        }));
        await saveAiTasks(taskObjects);

        const scheduledPlanCount = await schedulePlanTaskNotifications(merged);
        if (scheduledPlanCount > 0) {
          await addNotification({
            title: 'Plan Tasks Scheduled',
            message: `${scheduledPlanCount} daily task reminders are active.`,
            category: 'coach',
          });
        }

        if (effectiveTimetable.length > 0) {
          await saveAiTimetable(effectiveTimetable);
          setTimetable(effectiveTimetable);
          const scheduledCount = await scheduleStudyNotifications(effectiveTimetable);
          await addNotification({
            title: 'Study Timetable Saved',
            message: `AI prepared ${scheduledCount} weekly study reminders.`,
            category: 'coach',
          });
        }
      }

      if (!askedForPlan && parsed.timetable.length > 0) {
        await saveAiTimetable(parsed.timetable);
        setTimetable(parsed.timetable);
        const scheduledCount = await scheduleStudyNotifications(parsed.timetable);
        await addNotification({
          title: 'Study Timetable Saved',
          message: `AI created ${scheduledCount} weekly study reminders.`,
          category: 'coach',
        });
      }

      await addNotification({
        title: 'New AI Reply',
        message: parsed.cleanText.slice(0, 120),
        category: 'ai',
      });
    } catch (error) {
      const message = error instanceof Error ? error.message : 'AI reply failed';
      Alert.alert('AI Error', message);
    } finally {
      setLoadingChat(false);
    }
  };

  const clearTimetable = async () => {
    await clearAiTimetable();
    await clearScheduledStudyNotifications();
    setTimetable([]);
    notify('Stored timetable and reminders cleared');
  };

  const clearPlanAndSession = async () => {
    await clearAiPlanSnapshot();
    await clearAiChatSession();
    await clearAiTasks();
    await clearScheduledPlanNotifications();
    setSavedPlan('');
    setMessages([]);
    notify('AI chat session and saved plan cleared');
  };

  const voiceNoteInfo = () => {
    Alert.alert(
      'Voice To AI',
      'Voice mode can be enabled with native speech-to-text package integration. For now, type your struggles/efforts and AI will respond as your digital faculty.',
    );
  };

  useEffect(() => {
    if (messages.length === 0) {
      return;
    }

    const id = setTimeout(() => {
      chatListRef.current?.scrollToEnd({animated: true});
    }, 40);

    return () => clearTimeout(id);
  }, [messages]);

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      keyboardVerticalOffset={Platform.OS === 'ios' ? 12 : 0}>
      <AnimatedGradientBackground palette={palette} />
      <View style={styles.screen}>
        <View style={styles.header}>
          <Text style={[styles.overline, {color: palette.textSecondary}]}>AI Coach</Text>
          <Text style={[styles.title, {color: palette.textPrimary}]}>AI Study Mentor</Text>
          <View style={styles.metaRow}>
            <Text style={[styles.metaText, {color: palette.textMuted}]}>Subjects: {scopedRecords.length}</Text>
            <Text style={[styles.metaText, {color: palette.textMuted}]}>Avg: {overall.toFixed(1)}%</Text>
            <Text style={[styles.metaText, {color: palette.textMuted}]}>Slots: {timetable.length}</Text>
          </View>
          {!!focusSubject && <Text style={[styles.metaText, {color: palette.accent}]}>Focus: {focusSubject}</Text>}
          <View style={styles.headerActions}>
            <Pressable onPress={voiceNoteInfo}>
              <Text style={[styles.actionText, {color: palette.accent}]}>Voice Help</Text>
            </Pressable>
            <Pressable onPress={clearTimetable}>
              <Text style={[styles.actionText, {color: palette.danger}]}>Clear Timetable</Text>
            </Pressable>
            <Pressable onPress={clearPlanAndSession}>
              <Text style={[styles.actionText, {color: palette.danger}]}>Clear Chat</Text>
            </Pressable>
          </View>
        </View>

        <FlatList
          ref={chatListRef}
          data={messages}
          keyExtractor={item => item.id}
          style={styles.chatList}
          contentContainerStyle={styles.chatContent}
          onContentSizeChange={() => chatListRef.current?.scrollToEnd({animated: true})}
          ListEmptyComponent={
            <GlassCard palette={palette} style={styles.emptyCard}>
              <Text style={[styles.emptyTitle, {color: palette.textPrimary}]}>Start Chat Session</Text>
              <Text style={[styles.emptyBody, {color: palette.textSecondary}]}>Ask anything. If you request a plan or timetable, AI will save it and schedule study reminders.</Text>
            </GlassCard>
          }
          renderItem={({item}) => {
            const isAssistant = item.role === 'assistant';
            return (
              <View style={[styles.messageRow, isAssistant ? styles.leftAlign : styles.rightAlign]}>
                <View
                  style={[
                    styles.message,
                    {
                      borderColor: palette.cardBorder,
                      backgroundColor: isAssistant ? palette.accentSoft : palette.backgroundAlt,
                    },
                    isAssistant ? styles.assistantBubble : styles.userBubble,
                  ]}>
                  <Text style={[styles.messageRole, {color: palette.textSecondary}]}>{isAssistant ? 'AI Mentor' : 'You'}</Text>
                  <Text style={[styles.messageText, {color: palette.textPrimary}]}>{item.text}</Text>
                </View>
              </View>
            );
          }}
        />

        {!!savedPlan && (
          <View style={[styles.planStrip, {borderColor: palette.cardBorder, backgroundColor: palette.backgroundAlt}]}>
            <Text numberOfLines={2} style={[styles.planStripText, {color: palette.textSecondary}]}>Saved plan updated from recent chat.</Text>
          </View>
        )}

        <View style={[styles.composer, {borderColor: palette.cardBorder, backgroundColor: palette.backgroundAlt}]}> 
          <TextInput
            value={chatInput}
            onChangeText={setChatInput}
            placeholder="Type your need here..."
            placeholderTextColor={palette.textMuted}
            multiline
            style={[styles.composerInput, {color: palette.textPrimary}]}
          />
          <Pressable style={[styles.sendButton, {backgroundColor: palette.accent}]} onPress={sendMessage}>
            {loadingChat ? <ActivityIndicator color="#FFFFFF" /> : <Text style={styles.sendButtonText}>Send</Text>}
          </Pressable>
        </View>
      </View>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  screen: {
    flex: 1,
    paddingHorizontal: 14,
    paddingTop: 18,
    paddingBottom: 10,
  },
  header: {
    marginBottom: 10,
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
    lineHeight: 36,
  },
  subtitle: {
    marginTop: 4,
    marginBottom: 8,
    fontSize: 14,
    fontFamily: Platform.select(typography.body),
    lineHeight: 20,
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 2,
  },
  metaText: {
    fontSize: 12,
    fontFamily: Platform.select(typography.body),
    fontWeight: '600',
  },
  headerActions: {
    marginTop: 8,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  actionText: {
    fontSize: 12,
    fontFamily: Platform.select(typography.heading),
    fontWeight: '700',
  },
  chatList: {
    flex: 1,
  },
  chatContent: {
    paddingBottom: 10,
    gap: 8,
  },
  emptyCard: {
    marginTop: 8,
  },
  emptyTitle: {
    fontSize: 16,
    fontFamily: Platform.select(typography.heading),
    fontWeight: '700',
    marginBottom: 6,
  },
  emptyBody: {
    fontSize: 14,
    lineHeight: 20,
    fontFamily: Platform.select(typography.body),
  },
  messageRow: {
    flexDirection: 'row',
  },
  leftAlign: {
    justifyContent: 'flex-start',
  },
  rightAlign: {
    justifyContent: 'flex-end',
  },
  message: {
    borderWidth: 1,
    borderRadius: 14,
    paddingHorizontal: 12,
    paddingVertical: 10,
    maxWidth: '85%',
  },
  assistantBubble: {
    borderTopLeftRadius: 4,
  },
  userBubble: {
    borderTopRightRadius: 4,
  },
  messageRole: {
    fontSize: 10,
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
  planStrip: {
    marginTop: 4,
    borderWidth: 1,
    borderRadius: 10,
    paddingHorizontal: 10,
    paddingVertical: 8,
  },
  planStripText: {
    fontSize: 12,
    fontFamily: Platform.select(typography.body),
    fontWeight: '600',
  },
  composer: {
    marginTop: 8,
    borderWidth: 1,
    borderRadius: 16,
    padding: 10,
  },
  composerInput: {
    minHeight: 44,
    maxHeight: 120,
    fontSize: 14,
    fontFamily: Platform.select(typography.body),
    lineHeight: 20,
    textAlignVertical: 'top',
    paddingHorizontal: 4,
    paddingVertical: 2,
  },
  sendButton: {
    marginTop: 8,
    borderRadius: 12,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  sendButtonText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontFamily: Platform.select(typography.heading),
    fontWeight: '700',
    letterSpacing: 0.5,
    textTransform: 'uppercase',
  },
});

export default AICoachScreen;
