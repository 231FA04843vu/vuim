import AsyncStorage from '@react-native-async-storage/async-storage';

const LAST_SEEN_APP_VERSION_KEY = '@vuim/last_seen_app_version';

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