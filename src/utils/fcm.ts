import {Platform} from 'react-native';
import messaging from '@react-native-firebase/messaging';
import {notify} from './notify';
import {pushSystemUpdateNotification} from './updateNotifier';

export const RELEASE_TOPIC = 'vuim_updates';

export const bootstrapFcm = async () => {
  if (Platform.OS !== 'android') {
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
    const title = remoteMessage.notification?.title ?? 'VUIM Update';
    const body = remoteMessage.notification?.body ?? 'A new version is available.';

    notify(body);
    await pushSystemUpdateNotification(title, [body]);
  });
};