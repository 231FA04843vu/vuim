import {PermissionsAndroid, Platform} from 'react-native';
import messaging from '@react-native-firebase/messaging';
import {notify} from './notify';
import {pushSystemUpdateNotification} from './updateNotifier';

export const RELEASE_TOPIC = 'vuim_updates';
let systemNotificationsEnabled = true;

export const setSystemNotificationsRuntimeEnabled = (enabled: boolean) => {
  systemNotificationsEnabled = enabled;
};

const ensureAndroidNotificationPermission = async () => {
  if (Platform.OS !== 'android') {
    return true;
  }

  // Android 12 and below grant notification access at install time.
  if (typeof Platform.Version !== 'number' || Platform.Version < 33) {
    return true;
  }

  const permission = PermissionsAndroid.PERMISSIONS.POST_NOTIFICATIONS;
  const alreadyGranted = await PermissionsAndroid.check(permission);
  if (alreadyGranted) {
    return true;
  }

  const result = await PermissionsAndroid.request(permission, {
    title: 'Allow notifications',
    message: 'VUIM needs notification access to alert you about new app updates.',
    buttonPositive: 'Allow',
    buttonNegative: 'Not now',
  });

  return result === PermissionsAndroid.RESULTS.GRANTED;
};

export const syncFcmTopicSubscription = async (enabled: boolean) => {
  setSystemNotificationsRuntimeEnabled(enabled);

  if (Platform.OS !== 'android') {
    return;
  }

  if (!enabled) {
    try {
      await messaging().unsubscribeFromTopic(RELEASE_TOPIC);
    } catch {
      // Unsubscribe is best effort when app has not been fully registered yet.
    }
    return;
  }

  const canPostNotifications = await ensureAndroidNotificationPermission();
  if (!canPostNotifications) {
    notify('Notifications are disabled. Enable them in app settings.');
    return;
  }

  const status = await messaging().requestPermission();
  const granted =
    status === messaging.AuthorizationStatus.AUTHORIZED ||
    status === messaging.AuthorizationStatus.PROVISIONAL;

  if (!granted) {
    return;
  }

  await messaging().registerDeviceForRemoteMessages();
  await messaging().subscribeToTopic(RELEASE_TOPIC);
};

export const bootstrapFcm = async (enabled = true) => {
  await syncFcmTopicSubscription(enabled);

  if (Platform.OS !== 'android' || !enabled) {
    return;
  }

  const token = await messaging().getToken();
  if (token) {
    console.log('[FCM] token', token);
  }
};

export const registerForegroundFcmHandler = () => {
  if (Platform.OS !== 'android') {
    return () => {};
  }

  return messaging().onMessage(async remoteMessage => {
    if (!systemNotificationsEnabled) {
      return;
    }

    const title = remoteMessage.notification?.title ?? 'VUIM Update';
    const body = remoteMessage.notification?.body ?? 'A new version is available.';

    notify(body);
    await pushSystemUpdateNotification(title, [body]);
  });
};