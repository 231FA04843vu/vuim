import AsyncStorage from '@react-native-async-storage/async-storage';
import {DEFAULT_GEMINI_API_KEY} from '../config/ai';

const GEMINI_API_KEY = '@vuim/gemini_api_key';

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
