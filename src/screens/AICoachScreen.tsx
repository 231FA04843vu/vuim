import React, {useEffect, useMemo, useState} from 'react';
import {
  ActivityIndicator,
  Alert,
  FlatList,
  KeyboardAvoidingView,
  PermissionsAndroid,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import Ionicons from '@react-native-vector-icons/ionicons';
import {NativeStackScreenProps} from '@react-navigation/native-stack';
import Voice, {SpeechErrorEvent, SpeechResultsEvent} from '@react-native-voice/voice';
import {errorCodes, isErrorWithCode, pick, types} from '@react-native-documents/picker';
import Tts from 'react-native-tts';
import AnimatedGradientBackground from '../components/AnimatedGradientBackground';
import GlassCard from '../components/GlassCard';
import {useNotifications} from '../context/NotificationsContext';
import {useSubjects} from '../context/SubjectsContext';
import {RootStackParamList} from '../navigation/types';
import {
  clearAiChatSession,
  clearAiPlanSnapshot,
  clearAiTasks,
  clearAiStudyMaterials,
  clearAiTimetable,
  loadAiChatSession,
  loadAiPlanSnapshot,
  loadAiStudyMaterials,
  loadAiTimetable,
  loadAiApiKey,
  saveAiChatSession,
  saveAiPlanSnapshot,
  saveAiTasks,
  saveAiStudyMaterials,
  saveAiTimetable,
} from '../storage/aiStorage';
import {darkPalette, lightPalette, typography} from '../theme';
import {AIMessage, AITask, CoachTimeBlock} from '../types';
import {notify} from '../utils/notify';
import {buildMentorPrompt, extractPlanTasksFromText, extractTimetableFromMentorResponse, requestOpenRouterText} from '../utils/gemini';
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

const AICoachScreen = ({route, navigation}: Props) => {
  const {records, isDarkMode} = useSubjects();
  const {addNotification} = useNotifications();
  const palette = isDarkMode ? darkPalette : lightPalette;
  const focusSubject = route.params?.focusSubject?.trim();
  const messagesRef = React.useRef<AIMessage[]>([]);
  const sendMessageRef = React.useRef<(textOverride?: string) => Promise<void>>(async () => {});
  const recognizedTextRef = React.useRef('');
  const chatListRef = React.useRef<FlatList<AIMessage>>(null);
  const isTtsReadyRef = React.useRef(true);

  const [apiKey, setApiKey] = useState('');
  const [chatInput, setChatInput] = useState('');
  const [messages, setMessages] = useState<AIMessage[]>([]);
  const [loadingChat, setLoadingChat] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [isAiSpeaking, setIsAiSpeaking] = useState(false);
  const [isSpeechMuted, setIsSpeechMuted] = useState(false);
  const [timetable, setTimetable] = useState<CoachTimeBlock[]>([]);
  const [savedPlan, setSavedPlan] = useState('');
  const [uploadedContext, setUploadedContext] = useState('');
  const [uploadedNames, setUploadedNames] = useState<string[]>([]);

  useEffect(() => {
    messagesRef.current = messages;
  }, [messages]);

  useEffect(() => {
    const hydrate = async () => {
      const [key, storedTimetable, storedMessages, storedPlan, storedMaterials] = await Promise.all([
        loadAiApiKey(),
        loadAiTimetable(),
        loadAiChatSession(),
        loadAiPlanSnapshot(),
        loadAiStudyMaterials(),
      ]);
      setApiKey(key);
      setTimetable(storedTimetable);
      setMessages(normalizeChatOrder(storedMessages));
      setSavedPlan(storedPlan);
      setUploadedContext(storedMaterials);
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

  const sendMessage = async (textOverride?: string) => {
    const textToSend = (textOverride ?? chatInput).trim();

    if (!textToSend) {
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
      text: textToSend,
      createdAt: new Date().toISOString(),
    };

    const nextMessages = [...history, userMessage];
    setMessages(nextMessages);
    await saveAiChatSession(nextMessages);
    setChatInput('');

    try {
      setLoadingChat(true);
      const prompt = buildMentorPrompt(scopedRecords, userMessage.text, history);
      const promptWithUploads = uploadedContext
        ? `${prompt}\n\nUse the following uploaded study material context while planning and explaining:\n${uploadedContext}`
        : prompt;
      const aiText = await requestOpenRouterText({apiKey: apiKey.trim(), prompt: promptWithUploads});
      const parsed = extractTimetableFromMentorResponse(aiText);

      if (!isSpeechMuted && isTtsReadyRef.current) {
        try {
          await Tts.stop();
          setIsAiSpeaking(true);
          Tts.speak(parsed.cleanText);
        } catch {
          // Speech is best-effort only.
          setIsAiSpeaking(false);
          isTtsReadyRef.current = false;
        }
      }

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

  sendMessageRef.current = sendMessage;

  const requestMicPermission = async () => {
    if (Platform.OS !== 'android') {
      return true;
    }

    try {
      const status = await PermissionsAndroid.request(PermissionsAndroid.PERMISSIONS.RECORD_AUDIO, {
        title: 'Microphone permission',
        message: 'VUIM needs microphone access for voice chat input.',
        buttonPositive: 'Allow',
        buttonNegative: 'Deny',
      });
      return status === PermissionsAndroid.RESULTS.GRANTED;
    } catch {
      return false;
    }
  };

  const beginListening = async () => {
    if (loadingChat || isAiSpeaking) {
      return;
    }

    const granted = await requestMicPermission();
    if (!granted) {
      notify('Microphone permission is required for voice input');
      return;
    }

    try {
      recognizedTextRef.current = '';
      await Voice.start('en-US');
      setIsListening(true);
    } catch {
      setIsListening(false);
      notify('Unable to start voice capture');
    }
  };

  const handleMicPress = async () => {
    if (loadingChat || isAiSpeaking) {
      return;
    }

    if (isListening) {
      try {
        await Voice.stop();
      } catch {
        setIsListening(false);
      }
      return;
    }

    await beginListening();
  };

  const openLiveTalk = async () => {
    if (isListening) {
      try {
        await Voice.stop();
      } catch {
        // Ignore stop failures.
      }
      setIsListening(false);
    }

    navigation.navigate('LiveTalk', {focusSubject});
  };

  const toggleMuteSpeech = async () => {
    setIsSpeechMuted(prev => !prev);
    if (!isSpeechMuted && isTtsReadyRef.current) {
      try {
        await Tts.stop();
      } catch {
        isTtsReadyRef.current = false;
      }
    }
  };

  const isLikelyTextFile = (name: string | null, type: string | null) => {
    const lower = (name ?? '').toLowerCase();
    return (
      !!type && (type.startsWith('text/') || type.includes('json') || type.includes('xml'))
    ) || lower.endsWith('.txt') || lower.endsWith('.md') || lower.endsWith('.json') || lower.endsWith('.csv');
  };

  const loadFileSnippet = async (uri: string) => {
    try {
      const response = await fetch(uri);
      const text = await response.text();
      return text.replace(/\s+/g, ' ').trim().slice(0, 1400);
    } catch {
      return '';
    }
  };

  const handleUploadFiles = async () => {
    try {
      const picked = await pick({
        allowMultiSelection: true,
        mode: 'import',
        type: [types.allFiles],
      });

      if (picked.length === 0) {
        return;
      }

      const summaries: string[] = [];
      const pickedNames: string[] = [];

      for (const file of picked.slice(0, 5)) {
        const safeName = file.name ?? 'Unnamed file';
        pickedNames.push(safeName);
        const sizeLabel = file.size ? `${Math.round(file.size / 1024)}KB` : 'size unknown';
        let summary = `File: ${safeName} (${sizeLabel})`;

        if (isLikelyTextFile(file.name, file.type)) {
          const readUri = file.uri;
          const snippet = await loadFileSnippet(readUri);
          if (snippet) {
            summary += `\nKey content snippet: ${snippet}`;
          }
        }

        summaries.push(summary);
      }

      setUploadedNames(pickedNames);
      const mergedMaterials = summaries.join('\n\n');
      setUploadedContext(mergedMaterials);
      await saveAiStudyMaterials(mergedMaterials);
      notify(`${picked.length} study file(s) attached for AI planning context`);
    } catch (error) {
      if (isErrorWithCode(error)) {
        if (error.code === errorCodes.OPERATION_CANCELED || error.code === errorCodes.IN_PROGRESS) {
          return;
        }
      }

      if (error instanceof Error && /module .*RNDocumentPicker/i.test(error.message)) {
        Alert.alert('Upload Error', 'File picking is not available in the installed app build. Reinstall the app after this update.');
        return;
      }
      Alert.alert('Upload Error', 'Unable to pick files right now.');
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
    await clearAiStudyMaterials();
    await clearScheduledPlanNotifications();
    setSavedPlan('');
    setMessages([]);
    setUploadedContext('');
    setUploadedNames([]);
    notify('AI chat session and saved plan cleared');
  };

  const voiceNoteInfo = () => {
    Alert.alert(
      'Voice To AI',
      'Tap the mic button in the input corner to speak. Your voice is converted to text and sent automatically. AI replies are spoken unless muted.',
    );
  };

  useEffect(() => {
    try {
      Tts.setDefaultRate(0.5);
      Tts.setDefaultPitch(1.0);
      isTtsReadyRef.current = true;
    } catch {
      isTtsReadyRef.current = false;
    }

    Voice.onSpeechResults = (event: SpeechResultsEvent) => {
      const spoken = event.value?.[0]?.trim() ?? '';
      if (!spoken) {
        return;
      }
      recognizedTextRef.current = spoken;
      setChatInput(spoken);
    };

    Voice.onSpeechPartialResults = (event: SpeechResultsEvent) => {
      const spoken = event.value?.[0]?.trim() ?? '';
      if (!spoken) {
        return;
      }
      recognizedTextRef.current = spoken;
      setChatInput(spoken);
    };

    Voice.onSpeechError = (_event: SpeechErrorEvent) => {
      setIsListening(false);
      notify('Voice recognition failed');
    };

    Voice.onSpeechEnd = () => {
      setIsListening(false);
      const spoken = recognizedTextRef.current.trim();
      if (spoken.length > 0) {
        void sendMessageRef.current(spoken);
      }
    };

    if (isTtsReadyRef.current) {
      Tts.addEventListener('tts-start', () => {
        setIsAiSpeaking(true);
      });

      Tts.addEventListener('tts-finish', () => {
        setIsAiSpeaking(false);
      });

      Tts.addEventListener('tts-cancel', () => {
        setIsAiSpeaking(false);
      });
    }

    return () => {
      if (isTtsReadyRef.current) {
        void Tts.stop();
        Tts.removeAllListeners('tts-start');
        Tts.removeAllListeners('tts-finish');
        Tts.removeAllListeners('tts-cancel');
      }
      void Voice.destroy().then(Voice.removeAllListeners);
    };
  }, []);

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
      behavior={undefined}
      keyboardVerticalOffset={0}>
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
            <Pressable
              style={[styles.iconAction, {borderColor: palette.cardBorder, backgroundColor: palette.surface}]}
              onPress={toggleMuteSpeech}
              accessibilityLabel={isSpeechMuted ? 'Unmute AI voice' : 'Mute AI voice'}>
              <Ionicons
                name={isSpeechMuted ? 'volume-mute' : 'volume-high'}
                size={18}
                color={isSpeechMuted ? palette.danger : palette.accent}
              />
            </Pressable>
            <Pressable
              style={[styles.iconAction, {borderColor: palette.cardBorder, backgroundColor: palette.surface}]}
              onPress={() => navigation.navigate('MyTasks')}
              accessibilityLabel="Open My Tasks">
              <Ionicons name="checkbox-outline" size={18} color={palette.accent} />
            </Pressable>
            <Pressable
              style={[styles.iconAction, {borderColor: palette.cardBorder, backgroundColor: palette.surface}]}
              onPress={voiceNoteInfo}
              accessibilityLabel="Voice help">
              <Ionicons name="help-circle-outline" size={18} color={palette.accent} />
            </Pressable>
            <Pressable
              style={[styles.iconAction, {borderColor: palette.cardBorder, backgroundColor: palette.surface}]}
              onPress={clearTimetable}
              accessibilityLabel="Clear timetable">
              <Ionicons name="calendar-clear-outline" size={18} color={palette.danger} />
            </Pressable>
            <Pressable
              style={[styles.iconAction, {borderColor: palette.cardBorder, backgroundColor: palette.surface}]}
              onPress={clearPlanAndSession}
              accessibilityLabel="Clear chat">
              <Ionicons name="trash-outline" size={18} color={palette.danger} />
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

        {uploadedNames.length > 0 && (
          <View style={[styles.planStrip, {borderColor: palette.cardBorder, backgroundColor: palette.accentSoft}]}>
            <Text numberOfLines={2} style={[styles.planStripText, {color: palette.textPrimary}]}>
              {uploadedNames.length} file(s) ready: {uploadedNames.join(', ')}
            </Text>
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
          <View style={styles.composerActions}>
            <Pressable
              style={[
                styles.voiceButton,
                {
                  borderColor: palette.cardBorder,
                  backgroundColor: palette.surface,
                },
              ]}
              onPress={handleUploadFiles}
              accessibilityLabel="Upload study files">
              <Ionicons name="attach-outline" size={18} color={palette.textSecondary} />
            </Pressable>

            <Pressable
              style={[
                styles.voiceButton,
                {
                  borderColor: palette.cardBorder,
                  backgroundColor: palette.surface,
                },
              ]}
              onPress={openLiveTalk}
              accessibilityLabel="Open Live Talk">
              <Ionicons
                name="call-outline"
                size={18}
                color={palette.textSecondary}
              />
            </Pressable>

            <Pressable
              style={[
                styles.voiceButton,
                {
                  borderColor: palette.cardBorder,
                  backgroundColor: isListening ? palette.accentSoft : palette.surface,
                },
              ]}
              onPress={handleMicPress}>
              <Ionicons
                name={isListening ? 'mic' : 'mic-outline'}
                size={18}
                color={isListening ? palette.accent : palette.textSecondary}
              />
            </Pressable>

            <Pressable style={[styles.sendButton, {backgroundColor: palette.accent}]} onPress={() => void sendMessage()}>
              {loadingChat ? <ActivityIndicator color="#FFFFFF" /> : <Ionicons name="paper-plane" size={16} color="#FFFFFF" />}
            </Pressable>
          </View>
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
    gap: 10,
  },
  iconAction: {
    width: 36,
    height: 36,
    borderRadius: 18,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
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
  composerActions: {
    marginTop: 8,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-end',
    gap: 8,
  },
  voiceButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  sendButton: {
    borderRadius: 20,
    minWidth: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 12,
  },
});

export default AICoachScreen;
