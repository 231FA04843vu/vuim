import {NativeModules, PermissionsAndroid, Platform} from 'react-native';

type UpdateNotifierNative = {
  showUpdateNotification: (title: string, message: string) => void;
};

const updateNotifier = (NativeModules.UpdateNotifier as UpdateNotifierNative | undefined) ?? undefined;

const ensureAndroidNotificationPermission = async () => {
  if (Platform.OS !== 'android') {
    return true;
  }

  if (Platform.Version < 33) {
    return true;
  }

  const permission = PermissionsAndroid.PERMISSIONS.POST_NOTIFICATIONS;
  const alreadyGranted = await PermissionsAndroid.check(permission);
  if (alreadyGranted) {
    return true;
  }

  const result = await PermissionsAndroid.request(permission);
  return result === PermissionsAndroid.RESULTS.GRANTED;
};

export const pushSystemUpdateNotification = async (title: string, highlights: string[]) => {
  if (Platform.OS !== 'android' || !updateNotifier) {
    return false;
  }

  const granted = await ensureAndroidNotificationPermission();
  if (!granted) {
    return false;
  }

  const summary = highlights.slice(0, 3).join(' | ');
  updateNotifier.showUpdateNotification(title, summary);
  return true;
};