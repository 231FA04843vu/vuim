import {Platform, ToastAndroid} from 'react-native';

export const notify = (message: string) => {
  if (Platform.OS === 'android') {
    ToastAndroid.show(message, ToastAndroid.SHORT);
    return;
  }

  console.log(message);
};
