import React from 'react';
import {ActivityIndicator, StyleSheet, View} from 'react-native';
import {NavigationContainer} from '@react-navigation/native';
import {createNativeStackNavigator} from '@react-navigation/native-stack';
import {useSubjects} from '../context/SubjectsContext';
import {RootStackParamList} from './types';
import SubjectPerformanceScreen from '../screens/SubjectPerformanceScreen';
import {
  SplashScreen,
  HomeScreen,
  SubjectFormScreen,
  SavedRecordsScreen,
  AboutScreen,
  AICoachScreen,
  UpdatesScreen,
} from '../screens';
import {darkPalette, lightPalette} from '../theme';

const Stack = createNativeStackNavigator<RootStackParamList>();

const RootNavigator = () => {
  const {loading, isDarkMode} = useSubjects();
  const palette = isDarkMode ? darkPalette : lightPalette;

  if (loading) {
    return (
      <View style={[styles.loaderWrap, {backgroundColor: palette.background}]}> 
        <ActivityIndicator size="large" color={palette.accent} />
      </View>
    );
  }

  return (
    <NavigationContainer>
      <Stack.Navigator
        screenOptions={{
          headerShown: false,
          animation: 'slide_from_right',
        }}>
        <Stack.Screen name="Splash" component={SplashScreen} />
        <Stack.Screen name="Home" component={HomeScreen} />
        <Stack.Screen name="SubjectForm" component={SubjectFormScreen} />
        <Stack.Screen name="SavedRecords" component={SavedRecordsScreen} />
        <Stack.Screen name="SubjectPerformance" component={SubjectPerformanceScreen} />
        <Stack.Screen name="AICoach" component={AICoachScreen} />
        <Stack.Screen name="Updates" component={UpdatesScreen} />
        <Stack.Screen name="AboutApp" component={AboutScreen} />
      </Stack.Navigator>
    </NavigationContainer>
  );
};

const styles = StyleSheet.create({
  loaderWrap: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
});

export default RootNavigator;
