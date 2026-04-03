import AsyncStorage from '@react-native-async-storage/async-storage';
import {RUNTIME_OPENROUTER_API_KEY} from '../config/ai.runtime';
import {AIMessage, AITask, CoachTimeBlock} from '../types';

const OPENROUTER_API_KEY = '@vuim/openrouter_api_key';
const LEGACY_GEMINI_API_KEY = '@vuim/gemini_api_key';
const AI_TIMETABLE_KEY = '@vuim/ai_timetable';
const AI_CHAT_SESSION_KEY = '@vuim/ai_chat_session';
const AI_PLAN_SNAPSHOT_KEY = '@vuim/ai_plan_snapshot';
const AI_TASKS_KEY = '@vuim/ai_tasks';
const AI_STUDY_MATERIALS_KEY = '@vuim/ai_study_materials';

const DEFAULT_AI_SCOPE = '__all__';

const normalizeAiScope = (scope?: string) => {
  const trimmed = scope?.trim().toLowerCase();
  if (!trimmed) {
    return DEFAULT_AI_SCOPE;
  }
  return trimmed.replace(/[^a-z0-9]+/g, '_').replace(/^_+|_+$/g, '') || DEFAULT_AI_SCOPE;
};

const scopedKey = (baseKey: string, scope?: string) => `${baseKey}:${normalizeAiScope(scope)}`;

const isDefaultScope = (scope?: string) => normalizeAiScope(scope) === DEFAULT_AI_SCOPE;

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

    return RUNTIME_OPENROUTER_API_KEY;
  } catch {
    return RUNTIME_OPENROUTER_API_KEY;
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

export const loadAiTimetable = async (scope?: string): Promise<CoachTimeBlock[]> => {
  try {
    const key = scopedKey(AI_TIMETABLE_KEY, scope);
    let raw = await AsyncStorage.getItem(key);
    if (!raw && isDefaultScope(scope)) {
      raw = await AsyncStorage.getItem(AI_TIMETABLE_KEY);
    }
    if (!raw) {
      return [];
    }
    const parsed = JSON.parse(raw) as CoachTimeBlock[];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
};

export const saveAiTimetable = async (timetable: CoachTimeBlock[], scope?: string) => {
  await AsyncStorage.setItem(scopedKey(AI_TIMETABLE_KEY, scope), JSON.stringify(timetable));
};

export const clearAiTimetable = async (scope?: string) => {
  const keys = [scopedKey(AI_TIMETABLE_KEY, scope)];
  if (isDefaultScope(scope)) {
    keys.push(AI_TIMETABLE_KEY);
  }
  await AsyncStorage.multiRemove(keys);
};

export const loadAiChatSession = async (scope?: string): Promise<AIMessage[]> => {
  try {
    const key = scopedKey(AI_CHAT_SESSION_KEY, scope);
    let raw = await AsyncStorage.getItem(key);
    if (!raw && isDefaultScope(scope)) {
      raw = await AsyncStorage.getItem(AI_CHAT_SESSION_KEY);
    }
    if (!raw) {
      return [];
    }
    const parsed = JSON.parse(raw) as AIMessage[];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
};

export const saveAiChatSession = async (messages: AIMessage[], scope?: string) => {
  await AsyncStorage.setItem(scopedKey(AI_CHAT_SESSION_KEY, scope), JSON.stringify(messages.slice(0, 80)));
};

export const clearAiChatSession = async (scope?: string) => {
  const keys = [scopedKey(AI_CHAT_SESSION_KEY, scope)];
  if (isDefaultScope(scope)) {
    keys.push(AI_CHAT_SESSION_KEY);
  }
  await AsyncStorage.multiRemove(keys);
};

export const loadAiPlanSnapshot = async (scope?: string): Promise<string> => {
  try {
    const key = scopedKey(AI_PLAN_SNAPSHOT_KEY, scope);
    const value = await AsyncStorage.getItem(key);
    if (value !== null) {
      return value;
    }
    if (isDefaultScope(scope)) {
      return (await AsyncStorage.getItem(AI_PLAN_SNAPSHOT_KEY)) ?? '';
    }
    return '';
  } catch {
    return '';
  }
};

export const saveAiPlanSnapshot = async (planText: string, scope?: string) => {
  await AsyncStorage.setItem(scopedKey(AI_PLAN_SNAPSHOT_KEY, scope), planText.trim());
};

export const clearAiPlanSnapshot = async (scope?: string) => {
  const keys = [scopedKey(AI_PLAN_SNAPSHOT_KEY, scope)];
  if (isDefaultScope(scope)) {
    keys.push(AI_PLAN_SNAPSHOT_KEY);
  }
  await AsyncStorage.multiRemove(keys);
};

export const loadAiTasks = async (scope?: string): Promise<AITask[]> => {
  try {
    const key = scopedKey(AI_TASKS_KEY, scope);
    let raw = await AsyncStorage.getItem(key);
    if (!raw && isDefaultScope(scope)) {
      raw = await AsyncStorage.getItem(AI_TASKS_KEY);
    }
    if (!raw) {
      return [];
    }
    const parsed = JSON.parse(raw) as AITask[];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
};

export const saveAiTasks = async (tasks: AITask[], scope?: string) => {
  await AsyncStorage.setItem(scopedKey(AI_TASKS_KEY, scope), JSON.stringify(tasks.slice(0, 12)));
};

export const clearAiTasks = async (scope?: string) => {
  const keys = [scopedKey(AI_TASKS_KEY, scope)];
  if (isDefaultScope(scope)) {
    keys.push(AI_TASKS_KEY);
  }
  await AsyncStorage.multiRemove(keys);
};

export const loadAiStudyMaterials = async (scope?: string): Promise<string> => {
  try {
    const key = scopedKey(AI_STUDY_MATERIALS_KEY, scope);
    const value = await AsyncStorage.getItem(key);
    if (value !== null) {
      return value;
    }
    if (isDefaultScope(scope)) {
      return (await AsyncStorage.getItem(AI_STUDY_MATERIALS_KEY)) ?? '';
    }
    return '';
  } catch {
    return '';
  }
};

export const saveAiStudyMaterials = async (materialsText: string, scope?: string) => {
  await AsyncStorage.setItem(scopedKey(AI_STUDY_MATERIALS_KEY, scope), materialsText.trim());
};

export const clearAiStudyMaterials = async (scope?: string) => {
  const keys = [scopedKey(AI_STUDY_MATERIALS_KEY, scope)];
  if (isDefaultScope(scope)) {
    keys.push(AI_STUDY_MATERIALS_KEY);
  }
  await AsyncStorage.multiRemove(keys);
};
