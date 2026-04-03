import React, {useEffect} from 'react';
import {SafeAreaProvider} from 'react-native-safe-area-context';
import {SubjectsProvider} from './src/context/SubjectsContext';
import RootNavigator from './src/navigation/RootNavigator';
import {bootstrapFcm, registerForegroundFcmHandler} from './src/utils/fcm';

const App = () => {
  useEffect(() => {
    bootstrapFcm();
    const unsubscribe = registerForegroundFcmHandler();
    return unsubscribe;
  }, []);

  return (
    <SafeAreaProvider>
      <SubjectsProvider>
        <RootNavigator />
      </SubjectsProvider>
    </SafeAreaProvider>
  );
};

export default App;
