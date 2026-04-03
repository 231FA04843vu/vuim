import React, {useEffect, useMemo, useRef, useState} from 'react';
import {
  Alert,
  Animated,
  Easing,
  PermissionsAndroid,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import Ionicons from '@react-native-vector-icons/ionicons';
import {NativeStackScreenProps} from '@react-navigation/native-stack';
import Voice, {SpeechErrorEvent, SpeechResultsEvent} from '@react-native-voice/voice';
import Tts from 'react-native-tts';
import {useSubjects} from '../context/SubjectsContext';
import {RootStackParamList} from '../navigation/types';
import {loadAiApiKey, loadAiStudyMaterials, saveAiChatSession} from '../storage/aiStorage';
import {darkPalette, lightPalette, typography} from '../theme';
import {AIMessage} from '../types';
import {buildMentorPrompt, extractTimetableFromMentorResponse, requestOpenRouterText} from '../utils/gemini';
import {notify} from '../utils/notify';

type Props = NativeStackScreenProps<RootStackParamList, 'LiveTalk'>;

const LiveTalkScreen = ({route, navigation}: Props) => {
  const {records, isDarkMode} = useSubjects();
  const palette = isDarkMode ? darkPalette : lightPalette;
  const focusSubject = route.params?.focusSubject?.trim();
  const aiScope = focusSubject?.toLowerCase() ?? undefined;

  const [apiKey, setApiKey] = useState('');
  const [isMuted, setIsMuted] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [isAiSpeaking, setIsAiSpeaking] = useState(false);
  const [isSending, setIsSending] = useState(false);
  const [lastHeard, setLastHeard] = useState('');
  const [lastReply, setLastReply] = useState('');
  const [studyMaterials, setStudyMaterials] = useState('');

  const recognizedTextRef = useRef('');
  const isLiveRef = useRef(false);
  const isMutedRef = useRef(false);
  const isTtsReadyRef = useRef(true);
  const chatHistoryRef = useRef<AIMessage[]>([]);
  const wave = useRef(new Animated.Value(0)).current;
  const pulse = useRef(new Animated.Value(0)).current;

  const scopedRecords = useMemo(() => {
    if (!focusSubject) {
      return records;
    }
    return records.filter(item => item.subjectName.toLowerCase() === focusSubject.toLowerCase());
  }, [focusSubject, records]);

  useEffect(() => {
    isMutedRef.current = isMuted;
  }, [isMuted]);

  useEffect(() => {
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(wave, {
          toValue: 1,
          duration: 3200,
          easing: Easing.inOut(Easing.quad),
          useNativeDriver: false,
        }),
        Animated.timing(wave, {
          toValue: 0,
          duration: 3200,
          easing: Easing.inOut(Easing.quad),
          useNativeDriver: false,
        }),
      ]),
    );

    const pulseLoop = Animated.loop(
      Animated.sequence([
        Animated.timing(pulse, {
          toValue: 1,
          duration: 1600,
          easing: Easing.inOut(Easing.cubic),
          useNativeDriver: true,
        }),
        Animated.timing(pulse, {
          toValue: 0,
          duration: 1600,
          easing: Easing.inOut(Easing.cubic),
          useNativeDriver: true,
        }),
      ]),
    );

    loop.start();
    pulseLoop.start();
    return () => {
      loop.stop();
      pulseLoop.stop();
    };
  }, [pulse, wave]);

  useEffect(() => {
    const hydrate = async () => {
      const [key, materials] = await Promise.all([loadAiApiKey(), loadAiStudyMaterials(aiScope)]);
      setApiKey(key);
      setStudyMaterials(materials);
    };

    hydrate();
  }, [aiScope]);

  const requestMicPermission = async () => {
    if (Platform.OS !== 'android') {
      return true;
    }

    try {
      const status = await PermissionsAndroid.request(PermissionsAndroid.PERMISSIONS.RECORD_AUDIO, {
        title: 'Microphone permission',
        message: 'VUIM needs microphone access for Live Talk.',
        buttonPositive: 'Allow',
        buttonNegative: 'Deny',
      });
      return status === PermissionsAndroid.RESULTS.GRANTED;
    } catch {
      return false;
    }
  };

  const stopSpeechEngines = async () => {
    try {
      await Voice.stop();
    } catch {
      // Ignore stop failures.
    } finally {
      setIsListening(false);
    }

    if (isTtsReadyRef.current) {
      try {
        await Tts.stop();
      } catch {
        isTtsReadyRef.current = false;
      }
    }
  };

  const beginListening = async () => {
    if (!isLiveRef.current || isSending || isAiSpeaking) {
      return;
    }

    try {
      recognizedTextRef.current = '';
      await Voice.start('en-US');
      setIsListening(true);
    } catch {
      setIsListening(false);
      if (isLiveRef.current) {
        setTimeout(() => {
          void beginListening();
        }, 360);
      }
    }
  };

  const askMentor = async (spokenText: string) => {
    const resolvedKey = apiKey.trim() || (await loadAiApiKey()).trim();
    if (!resolvedKey) {
      notify(__DEV__ ? 'AI key missing in this local build. Install release APK from GitHub Actions.' : 'AI service is not configured right now');
      return;
    }
    if (resolvedKey !== apiKey) {
      setApiKey(resolvedKey);
    }

    setLastHeard(spokenText);
    const userMessage: AIMessage = {
      id: `${Date.now()}-live-user`,
      role: 'user',
      text: spokenText,
      createdAt: new Date().toISOString(),
    };

    const history = [...chatHistoryRef.current, userMessage];
    chatHistoryRef.current = history;

    try {
      setIsSending(true);
      const prompt = buildMentorPrompt(scopedRecords, spokenText, history.slice(-8));
      const promptWithMaterials = studyMaterials
        ? `${prompt}\n\nUse the following uploaded study material context while helping:\n${studyMaterials}`
        : prompt;
      const aiText = await requestOpenRouterText({apiKey: resolvedKey, prompt: promptWithMaterials});
      const parsed = extractTimetableFromMentorResponse(aiText);
      const aiReply = parsed.cleanText;
      setLastReply(aiReply);

      const aiMessage: AIMessage = {
        id: `${Date.now()}-live-ai`,
        role: 'assistant',
        text: aiReply,
        createdAt: new Date().toISOString(),
      };
      chatHistoryRef.current = [...chatHistoryRef.current, aiMessage].slice(-20);
      await saveAiChatSession(chatHistoryRef.current, aiScope);

      if (isTtsReadyRef.current && !isMutedRef.current) {
        try {
          await Tts.stop();
          Tts.speak(aiReply);
        } catch {
          isTtsReadyRef.current = false;
          setTimeout(() => {
            void beginListening();
          }, 200);
        }
      } else {
        setTimeout(() => {
          void beginListening();
        }, 220);
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Live Talk failed';
      Alert.alert('Live Talk Error', message);
      setTimeout(() => {
        void beginListening();
      }, 260);
    } finally {
      setIsSending(false);
    }
  };

  const startLiveTalk = async () => {
    const granted = await requestMicPermission();
    if (!granted) {
      notify('Microphone permission is required for Live Talk');
      return;
    }

    isLiveRef.current = true;
    await beginListening();
  };

  const endLiveTalk = async () => {
    isLiveRef.current = false;
    setIsListening(false);
    setIsAiSpeaking(false);
    await stopSpeechEngines();
    navigation.goBack();
  };

  const toggleMute = async () => {
    setIsMuted(prev => !prev);
    if (!isMuted && isTtsReadyRef.current) {
      try {
        await Tts.stop();
      } catch {
        isTtsReadyRef.current = false;
      }
      if (isLiveRef.current) {
        setTimeout(() => {
          void beginListening();
        }, 150);
      }
    }
  };

  const restartListening = async () => {
    const granted = await requestMicPermission();
    if (!granted) {
      notify('Microphone permission is required for Live Talk');
      return;
    }

    if (!isLiveRef.current) {
      isLiveRef.current = true;
    }
    await stopSpeechEngines();
    setIsAiSpeaking(false);
    await beginListening();
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
    };

    Voice.onSpeechPartialResults = (event: SpeechResultsEvent) => {
      const spoken = event.value?.[0]?.trim() ?? '';
      if (!spoken) {
        return;
      }
      recognizedTextRef.current = spoken;
    };

    Voice.onSpeechError = (_event: SpeechErrorEvent) => {
      setIsListening(false);
      if (isLiveRef.current) {
        setTimeout(() => {
          void beginListening();
        }, 350);
      }
    };

    Voice.onSpeechEnd = () => {
      setIsListening(false);
      const spoken = recognizedTextRef.current.trim();
      if (!isLiveRef.current) {
        return;
      }
      if (spoken) {
        void askMentor(spoken);
      } else {
        setTimeout(() => {
          void beginListening();
        }, 300);
      }
    };

    if (isTtsReadyRef.current) {
      Tts.addEventListener('tts-start', () => {
        setIsAiSpeaking(true);
      });

      Tts.addEventListener('tts-finish', () => {
        setIsAiSpeaking(false);
        if (isLiveRef.current && !isMutedRef.current) {
          setTimeout(() => {
            void beginListening();
          }, 220);
        }
      });

      Tts.addEventListener('tts-cancel', () => {
        setIsAiSpeaking(false);
      });
    }

    void startLiveTalk();

    return () => {
      isLiveRef.current = false;
      void stopSpeechEngines();
      if (isTtsReadyRef.current) {
        Tts.removeAllListeners('tts-start');
        Tts.removeAllListeners('tts-finish');
        Tts.removeAllListeners('tts-cancel');
      }
      void Voice.destroy().then(Voice.removeAllListeners);
    };
  }, []);

  const backgroundA = wave.interpolate({
    inputRange: [0, 0.5, 1],
    outputRange: isDarkMode ? ['#081230', '#10183E', '#0A1030'] : ['#DCE9FF', '#D3EEFF', '#E4EAFD'],
  });

  const backgroundB = wave.interpolate({
    inputRange: [0, 0.5, 1],
    outputRange: isDarkMode ? ['#132858', '#1D3B65', '#0F2C56'] : ['#B8D6FF', '#C3E7FF', '#CCE0FF'],
  });

  const orbScale = pulse.interpolate({
    inputRange: [0, 1],
    outputRange: [1, 1.08],
  });

  const statusLabel = isSending
    ? 'Thinking...'
    : isAiSpeaking
      ? 'Speaking...'
      : isListening
        ? 'Listening...'
        : 'Connecting...';

  return (
    <View style={styles.container}>
      <Animated.View style={[StyleSheet.absoluteFillObject, {backgroundColor: backgroundA}]} />
      <Animated.View style={[styles.waveLayer, {backgroundColor: backgroundB}]} />
      <View style={styles.topBar}>
        <Pressable style={styles.topIconButton} onPress={endLiveTalk} accessibilityLabel="Back from live talk">
          <Ionicons name="chevron-back" size={22} color="#FFFFFF" />
        </Pressable>
        <Text style={styles.topTitle}>Live Talk</Text>
        <View style={styles.topPlaceholder} />
      </View>

      <View style={styles.centerWrap}>
        <Animated.View
          style={[
            styles.orb,
            {
              transform: [{scale: orbScale}],
              backgroundColor: isAiSpeaking
                ? 'rgba(239, 68, 68, 0.42)'
                : isListening
                  ? 'rgba(59, 130, 246, 0.42)'
                  : 'rgba(15, 118, 110, 0.42)',
            },
          ]}>
          <Ionicons
            name={isAiSpeaking ? 'volume-high' : isListening ? 'mic' : 'radio'}
            size={42}
            color="#FFFFFF"
          />
        </Animated.View>

        <Text style={styles.statusText}>{statusLabel}</Text>
        {!!focusSubject && <Text style={styles.focusText}>Focus: {focusSubject}</Text>}
      </View>

      <View style={styles.transcriptWrap}>
        <Text numberOfLines={2} style={styles.transcriptLine}>
          {lastHeard ? `You: ${lastHeard}` : 'You: say anything to start your study session'}
        </Text>
        <Text numberOfLines={2} style={styles.transcriptLine}>
          {lastReply ? `AI: ${lastReply}` : 'AI: I will reply with plans and concept help'}
        </Text>
      </View>

      <View style={styles.controlsRow}>
        <Pressable style={styles.controlButton} onPress={toggleMute} accessibilityLabel={isMuted ? 'Unmute' : 'Mute'}>
          <Ionicons name={isMuted ? 'volume-mute' : 'volume-high'} size={28} color="#FFFFFF" />
        </Pressable>
        <Pressable style={styles.controlButton} onPress={() => void restartListening()} accessibilityLabel="Restart listening">
          <Ionicons name={isListening ? 'mic' : 'mic-outline'} size={28} color="#FFFFFF" />
        </Pressable>
        <Pressable
          style={[styles.controlButton, styles.endButton]}
          onPress={endLiveTalk}
          accessibilityLabel="End live talk">
          <Ionicons name="close" size={30} color="#FFFFFF" />
        </Pressable>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0C1530',
  },
  waveLayer: {
    position: 'absolute',
    width: 360,
    height: 360,
    borderRadius: 200,
    right: -110,
    top: 80,
    opacity: 0.55,
  },
  topBar: {
    marginTop: 30,
    paddingHorizontal: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  topIconButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
  },
  topTitle: {
    color: '#FFFFFF',
    fontSize: 24,
    fontFamily: Platform.select(typography.display),
    fontWeight: '700',
  },
  topPlaceholder: {
    width: 40,
    height: 40,
  },
  centerWrap: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 14,
    paddingHorizontal: 24,
  },
  orb: {
    width: 184,
    height: 184,
    borderRadius: 92,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.36)',
  },
  statusText: {
    color: '#FFFFFF',
    fontSize: 22,
    fontFamily: Platform.select(typography.heading),
    fontWeight: '700',
  },
  focusText: {
    color: 'rgba(255, 255, 255, 0.82)',
    fontSize: 14,
    fontFamily: Platform.select(typography.body),
    fontWeight: '600',
  },
  transcriptWrap: {
    marginHorizontal: 16,
    borderRadius: 16,
    paddingVertical: 10,
    paddingHorizontal: 12,
    backgroundColor: 'rgba(0, 0, 0, 0.18)',
    gap: 6,
  },
  transcriptLine: {
    color: 'rgba(255, 255, 255, 0.9)',
    fontSize: 12,
    lineHeight: 17,
    fontFamily: Platform.select(typography.body),
  },
  controlsRow: {
    paddingTop: 14,
    paddingBottom: 24,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 22,
  },
  controlButton: {
    width: 68,
    height: 68,
    borderRadius: 34,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(11, 25, 58, 0.62)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.26)',
  },
  endButton: {
    backgroundColor: '#EF4444',
    borderColor: '#FCA5A5',
  },
});

export default LiveTalkScreen;
