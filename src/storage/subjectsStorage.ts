import AsyncStorage from '@react-native-async-storage/async-storage';
import {AppPreferences, SubjectRecord} from '../types';

const RECORDS_KEY = '@vuim/records';
const PREFS_KEY = '@vuim/prefs';

const defaultPrefs: AppPreferences = {
  isDarkMode: false,
};

export const loadRecords = async (): Promise<SubjectRecord[]> => {
  try {
    const stored = await AsyncStorage.getItem(RECORDS_KEY);
    if (!stored) {
      return [];
    }
    const parsed = JSON.parse(stored) as SubjectRecord[];
    if (!Array.isArray(parsed)) {
      return [];
    }
    return parsed;
  } catch {
    return [];
  }
};

export const saveRecords = async (records: SubjectRecord[]) => {
  await AsyncStorage.setItem(RECORDS_KEY, JSON.stringify(records));
};

export const loadPrefs = async (): Promise<AppPreferences> => {
  try {
    const stored = await AsyncStorage.getItem(PREFS_KEY);
    if (!stored) {
      return defaultPrefs;
    }
    const parsed = JSON.parse(stored) as AppPreferences;
    return {
      ...defaultPrefs,
      ...parsed,
    };
  } catch {
    return defaultPrefs;
  }
};

export const savePrefs = async (prefs: AppPreferences) => {
  await AsyncStorage.setItem(PREFS_KEY, JSON.stringify(prefs));
};

export const resetAllData = async () => {
  await AsyncStorage.removeItem(RECORDS_KEY);
  await AsyncStorage.removeItem(PREFS_KEY);
};
