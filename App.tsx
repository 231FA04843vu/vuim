import React from 'react';
import {SafeAreaProvider} from 'react-native-safe-area-context';
import {SubjectsProvider} from './src/context/SubjectsContext';
import RootNavigator from './src/navigation/RootNavigator';

const App = () => (
  <SafeAreaProvider>
    <SubjectsProvider>
      <RootNavigator />
    </SubjectsProvider>
  </SafeAreaProvider>
);

export default App;
