import AsyncStorage from '@react-native-async-storage/async-storage';

const LAST_SEEN_APP_VERSION_KEY = '@vuim/last_seen_app_version';
const LAST_PROMPTED_RELEASE_KEY = '@vuim/last_prompted_release';

export const loadLastSeenAppVersion = async (): Promise<string | null> => {
  try {
    return await AsyncStorage.getItem(LAST_SEEN_APP_VERSION_KEY);
  } catch {
    return null;
  }
};

export const saveLastSeenAppVersion = async (version: string) => {
  await AsyncStorage.setItem(LAST_SEEN_APP_VERSION_KEY, version);
};

export const loadLastPromptedRelease = async (): Promise<string | null> => {
  try {
    return await AsyncStorage.getItem(LAST_PROMPTED_RELEASE_KEY);
  } catch {
    return null;
  }
};

export const saveLastPromptedRelease = async (version: string) => {
  await AsyncStorage.setItem(LAST_PROMPTED_RELEASE_KEY, version);
};