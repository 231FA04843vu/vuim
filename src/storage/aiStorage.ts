import AsyncStorage from '@react-native-async-storage/async-storage';
import {DEFAULT_OPENROUTER_API_KEY} from '../config/ai';
import {AIMessage, AITask, CoachTimeBlock} from '../types';

const OPENROUTER_API_KEY = '@vuim/openrouter_api_key';
const LEGACY_GEMINI_API_KEY = '@vuim/gemini_api_key';
const AI_TIMETABLE_KEY = '@vuim/ai_timetable';
const AI_CHAT_SESSION_KEY = '@vuim/ai_chat_session';
const AI_PLAN_SNAPSHOT_KEY = '@vuim/ai_plan_snapshot';
const AI_TASKS_KEY = '@vuim/ai_tasks';
const AI_STUDY_MATERIALS_KEY = '@vuim/ai_study_materials';

export const loadAiApiKey = async (): Promise<string> => {
  try {
    const openRouterKey = await AsyncStorage.getItem(OPENROUTER_API_KEY);
    if (openRouterKey?.trim()) {
      return openRouterKey;
    }

    // Keep backward compatibility for existing installs using the previous key slot.
    const legacyGeminiKey = await AsyncStorage.getItem(LEGACY_GEMINI_API_KEY);
    if (legacyGeminiKey?.trim()) {
      await AsyncStorage.setItem(OPENROUTER_API_KEY, legacyGeminiKey.trim());
      return legacyGeminiKey.trim();
    }

    return DEFAULT_OPENROUTER_API_KEY;
  } catch {
    return DEFAULT_OPENROUTER_API_KEY;
  }
};

export const saveAiApiKey = async (apiKey: string) => {
  await AsyncStorage.setItem(OPENROUTER_API_KEY, apiKey.trim());
};

export const clearAiApiKey = async () => {
  await AsyncStorage.multiRemove([OPENROUTER_API_KEY, LEGACY_GEMINI_API_KEY]);
};

// Backward-compatible aliases used by older imports.
export const loadGeminiApiKey = loadAiApiKey;
export const saveGeminiApiKey = saveAiApiKey;
export const clearGeminiApiKey = clearAiApiKey;

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

export const loadAiStudyMaterials = async (): Promise<string> => {
  try {
    return (await AsyncStorage.getItem(AI_STUDY_MATERIALS_KEY)) ?? '';
  } catch {
    return '';
  }
};

export const saveAiStudyMaterials = async (materialsText: string) => {
  await AsyncStorage.setItem(AI_STUDY_MATERIALS_KEY, materialsText.trim());
};

export const clearAiStudyMaterials = async () => {
  await AsyncStorage.removeItem(AI_STUDY_MATERIALS_KEY);
};
