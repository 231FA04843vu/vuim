import React, {useEffect, useState} from 'react';
import {SafeAreaProvider} from 'react-native-safe-area-context';
import messaging from '@react-native-firebase/messaging';
import {NotificationsProvider} from './src/context/NotificationsContext';
import {SubjectsProvider} from './src/context/SubjectsContext';
import RootNavigator from './src/navigation/RootNavigator';
import {bootstrapFcm, registerForegroundFcmHandler} from './src/utils/fcm';

const App = () => {
  const [initialRouteName, setInitialRouteName] = useState<'Splash' | 'Updates'>('Splash');

  useEffect(() => {
    bootstrapFcm().catch(error => {
      console.warn('FCM bootstrap failed', error);
    });

    const unsubscribeOpened = messaging().onNotificationOpenedApp(() => {
      setInitialRouteName('Updates');
    });

    messaging()
      .getInitialNotification()
      .then(message => {
        if (message) {
          setInitialRouteName('Updates');
        }
      })
      .catch(error => {
        console.warn('FCM initial notification lookup failed', error);
      });

    const unsubscribe = registerForegroundFcmHandler();
    return () => {
      unsubscribeOpened();
      unsubscribe();
    };
  }, []);

  return (
    <SafeAreaProvider>
      <SubjectsProvider>
        <NotificationsProvider>
          <RootNavigator key={initialRouteName} initialRouteName={initialRouteName} />
        </NotificationsProvider>
      </SubjectsProvider>
    </SafeAreaProvider>
  );
};

export default App;
