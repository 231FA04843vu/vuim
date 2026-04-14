import AsyncStorage from '@react-native-async-storage/async-storage';

const LAST_SEEN_APP_VERSION_KEY = '@vuim/last_seen_app_version';
const LAST_PROMPTED_RELEASE_KEY = '@vuim/last_prompted_release';
const CACHED_LATEST_RELEASE_KEY = '@vuim/cached_latest_release';

export type CachedLatestRelease = {
  tag: string;
  name: string;
  publishedAt: string;
  body: string;
  downloadUrl: string;
  cachedAt: string;
};

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

export const loadCachedLatestRelease = async (): Promise<CachedLatestRelease | null> => {
  try {
    const raw = await AsyncStorage.getItem(CACHED_LATEST_RELEASE_KEY);
    if (!raw) {
      return null;
    }
    const parsed = JSON.parse(raw) as Partial<CachedLatestRelease>;
    if (!parsed.tag) {
      return null;
    }

    return {
      tag: parsed.tag,
      name: parsed.name ?? '',
      publishedAt: parsed.publishedAt ?? '',
      body: parsed.body ?? '',
      downloadUrl: parsed.downloadUrl ?? '',
      cachedAt: parsed.cachedAt ?? '',
    };
  } catch {
    return null;
  }
};

export const saveCachedLatestRelease = async (release: CachedLatestRelease) => {
  await AsyncStorage.setItem(CACHED_LATEST_RELEASE_KEY, JSON.stringify(release));
};