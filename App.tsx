import React, {useCallback, useEffect, useRef, useState} from 'react';
import {Alert, AppState} from 'react-native';
import {SafeAreaProvider} from 'react-native-safe-area-context';
import messaging from '@react-native-firebase/messaging';
import {createNavigationContainerRef} from '@react-navigation/native';
import {NotificationsProvider} from './src/context/NotificationsContext';
import {SubjectsProvider} from './src/context/SubjectsContext';
import RootNavigator from './src/navigation/RootNavigator';
import {RootStackParamList} from './src/navigation/types';
import {APP_VERSION} from './src/config/appMeta';
import {loadLastPromptedRelease, saveLastPromptedRelease} from './src/storage/updateStorage';
import {bootstrapFcm, registerForegroundFcmHandler} from './src/utils/fcm';
import {getLatestReleaseInfo} from './src/utils/releaseInfo';

const compareVersions = (left: string, right: string): number => {
  const normalize = (value: string) =>
    value
      .replace(/^v/i, '')
      .split('.')
      .map(part => Number.parseInt(part, 10) || 0);

  const a = normalize(left);
  const b = normalize(right);
  const max = Math.max(a.length, b.length);
  for (let index = 0; index < max; index += 1) {
    const delta = (a[index] ?? 0) - (b[index] ?? 0);
    if (delta !== 0) {
      return delta;
    }
  }
  return 0;
};

const App = () => {
  const [initialRouteName, setInitialRouteName] = useState<'Splash' | 'Updates'>('Splash');
  const navigationRef = useRef(createNavigationContainerRef<RootStackParamList>()).current;
  const pendingOpenUpdatesRef = useRef(false);
  const promptInFlightRef = useRef(false);

  const openUpdatesScreen = useCallback(() => {
    if (navigationRef.isReady()) {
      const currentRoute = navigationRef.getCurrentRoute()?.name;
      if (currentRoute !== 'Updates') {
        navigationRef.navigate('Updates');
      }
      return;
    }

    pendingOpenUpdatesRef.current = true;
  }, [navigationRef]);

  const fetchLatestReleaseTag = useCallback(async () => {
    const release = await getLatestReleaseInfo();
    if (!release?.tag) {
      return null;
    }
    return release.tag;
  }, []);

  const runInAppUpdatePrompt = useCallback(async () => {
    if (promptInFlightRef.current) {
      return;
    }
    promptInFlightRef.current = true;

    try {
      const latestRelease = await fetchLatestReleaseTag();
      if (!latestRelease || compareVersions(latestRelease, APP_VERSION) <= 0) {
        return;
      }

      const lastPrompted = await loadLastPromptedRelease();
      if (lastPrompted === latestRelease) {
        return;
      }

      const currentRoute = navigationRef.getCurrentRoute()?.name;
      if (currentRoute === 'Updates') {
        await saveLastPromptedRelease(latestRelease);
        return;
      }

      Alert.alert(
        'New Version Available',
        `A new release (${latestRelease}) is available. Open Updates now?`,
        [
          {
            text: 'Later',
            style: 'cancel',
            onPress: () => {
              void saveLastPromptedRelease(latestRelease);
            },
          },
          {
            text: 'Open Updates',
            onPress: () => {
              void saveLastPromptedRelease(latestRelease);
              openUpdatesScreen();
            },
          },
        ],
      );
    } catch (error) {
      console.warn('In-app release prompt failed', error);
    } finally {
      promptInFlightRef.current = false;
    }
  }, [fetchLatestReleaseTag, navigationRef, openUpdatesScreen]);

  useEffect(() => {
    // NotificationsContext hydrates the saved user preference and then syncs FCM topic state.
    bootstrapFcm(false).catch(error => {
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

    const appStateSubscription = AppState.addEventListener('change', state => {
      if (state === 'active') {
        void runInAppUpdatePrompt();
      }
    });

    const pollTimer = setInterval(() => {
      void runInAppUpdatePrompt();
    }, 60000);

    void runInAppUpdatePrompt();

    const unsubscribe = registerForegroundFcmHandler();
    return () => {
      unsubscribeOpened();
      unsubscribe();
      appStateSubscription.remove();
      clearInterval(pollTimer);
    };
  }, [runInAppUpdatePrompt]);

  const handleNavigatorReady = useCallback(() => {
    if (pendingOpenUpdatesRef.current) {
      pendingOpenUpdatesRef.current = false;
      openUpdatesScreen();
    }
  }, [openUpdatesScreen]);

  return (
    <SafeAreaProvider>
      <SubjectsProvider>
        <NotificationsProvider>
          <RootNavigator
            key={initialRouteName}
            initialRouteName={initialRouteName}
            onReady={handleNavigatorReady}
            navigationRef={navigationRef}
          />
        </NotificationsProvider>
      </SubjectsProvider>
    </SafeAreaProvider>
  );
};

export default App;
