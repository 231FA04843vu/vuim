import AsyncStorage from '@react-native-async-storage/async-storage';

const NOTIFICATION_PREFS_KEY = '@vuim/notification-prefs';

export type NotificationPrefs = {
  systemNotificationsEnabled: boolean;
  inAppNotificationsEnabled: boolean;
};

const defaultNotificationPrefs: NotificationPrefs = {
  systemNotificationsEnabled: true,
  inAppNotificationsEnabled: true,
};

export const loadNotificationPrefs = async (): Promise<NotificationPrefs> => {
  try {
    const stored = await AsyncStorage.getItem(NOTIFICATION_PREFS_KEY);
    if (!stored) {
      return defaultNotificationPrefs;
    }

    const parsed = JSON.parse(stored) as Partial<NotificationPrefs>;

    return {
      systemNotificationsEnabled:
        typeof parsed.systemNotificationsEnabled === 'boolean'
          ? parsed.systemNotificationsEnabled
          : defaultNotificationPrefs.systemNotificationsEnabled,
      inAppNotificationsEnabled:
        typeof parsed.inAppNotificationsEnabled === 'boolean'
          ? parsed.inAppNotificationsEnabled
          : defaultNotificationPrefs.inAppNotificationsEnabled,
    };
  } catch {
    return defaultNotificationPrefs;
  }
};

export const saveNotificationPrefs = async (prefs: NotificationPrefs) => {
  await AsyncStorage.setItem(NOTIFICATION_PREFS_KEY, JSON.stringify(prefs));
};