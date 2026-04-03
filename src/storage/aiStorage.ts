import AsyncStorage from '@react-native-async-storage/async-storage';
import {DEFAULT_GEMINI_API_KEY} from '../config/ai';
import {AIMessage, AITask, CoachTimeBlock} from '../types';

const GEMINI_API_KEY = '@vuim/gemini_api_key';
const AI_TIMETABLE_KEY = '@vuim/ai_timetable';
const AI_CHAT_SESSION_KEY = '@vuim/ai_chat_session';
const AI_PLAN_SNAPSHOT_KEY = '@vuim/ai_plan_snapshot';
const AI_TASKS_KEY = '@vuim/ai_tasks';

export const loadGeminiApiKey = async (): Promise<string> => {
  try {
    return (await AsyncStorage.getItem(GEMINI_API_KEY)) ?? DEFAULT_GEMINI_API_KEY;
  } catch {
    return DEFAULT_GEMINI_API_KEY;
  }
};

export const saveGeminiApiKey = async (apiKey: string) => {
  await AsyncStorage.setItem(GEMINI_API_KEY, apiKey.trim());
};

export const clearGeminiApiKey = async () => {
  await AsyncStorage.removeItem(GEMINI_API_KEY);
};

export const loadAiTimetable = async (): Promise<CoachTimeBlock[]> => {
  try {
    const raw = await AsyncStorage.getItem(AI_TIMETABLE_KEY);
    if (!raw) {
      return [];
    }
    const parsed = JSON.parse(raw) as CoachTimeBlock[];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
};

export const saveAiTimetable = async (timetable: CoachTimeBlock[]) => {
  await AsyncStorage.setItem(AI_TIMETABLE_KEY, JSON.stringify(timetable));
};

export const clearAiTimetable = async () => {
  await AsyncStorage.removeItem(AI_TIMETABLE_KEY);
};

export const loadAiChatSession = async (): Promise<AIMessage[]> => {
  try {
    const raw = await AsyncStorage.getItem(AI_CHAT_SESSION_KEY);
    if (!raw) {
      return [];
    }
    const parsed = JSON.parse(raw) as AIMessage[];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
};

export const saveAiChatSession = async (messages: AIMessage[]) => {
  await AsyncStorage.setItem(AI_CHAT_SESSION_KEY, JSON.stringify(messages.slice(0, 80)));
};

export const clearAiChatSession = async () => {
  await AsyncStorage.removeItem(AI_CHAT_SESSION_KEY);
};

export const loadAiPlanSnapshot = async (): Promise<string> => {
  try {
    return (await AsyncStorage.getItem(AI_PLAN_SNAPSHOT_KEY)) ?? '';
  } catch {
    return '';
  }
};

export const saveAiPlanSnapshot = async (planText: string) => {
  await AsyncStorage.setItem(AI_PLAN_SNAPSHOT_KEY, planText.trim());
};

export const clearAiPlanSnapshot = async () => {
  await AsyncStorage.removeItem(AI_PLAN_SNAPSHOT_KEY);
};

export const loadAiTasks = async (): Promise<AITask[]> => {
  try {
    const raw = await AsyncStorage.getItem(AI_TASKS_KEY);
    if (!raw) {
      return [];
    }
    const parsed = JSON.parse(raw) as AITask[];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
};

export const saveAiTasks = async (tasks: AITask[]) => {
  await AsyncStorage.setItem(AI_TASKS_KEY, JSON.stringify(tasks.slice(0, 12)));
};

export const clearAiTasks = async () => {
  await AsyncStorage.removeItem(AI_TASKS_KEY);
};
