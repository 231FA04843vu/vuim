import React from 'react';
import {ActivityIndicator, StyleSheet, View} from 'react-native';
import {NavigationContainer, NavigationContainerRef} from '@react-navigation/native';
import {createNativeStackNavigator} from '@react-navigation/native-stack';
import {useSubjects} from '../context/SubjectsContext';
import {RootStackParamList} from './types';
import NotificationsScreen from '../screens/NotificationsScreen';
import SubjectPerformanceScreen from '../screens/SubjectPerformanceScreen';
import {
  SplashScreen,
  HomeScreen,
  SubjectFormScreen,
  SavedRecordsScreen,
  AboutScreen,
  AboutDetailScreen,
  MyTasksScreen,
  AICoachScreen,
  LiveTalkScreen,
  UpdatesScreen,
} from '../screens';
import {darkPalette, lightPalette} from '../theme';

const Stack = createNativeStackNavigator<RootStackParamList>();

interface RootNavigatorProps {
  onReady?: () => void;
  initialRouteName?: keyof RootStackParamList;
  navigationRef?: React.Ref<NavigationContainerRef<RootStackParamList>>;
}

export const RootNavigator = ({ onReady, initialRouteName = 'Splash', navigationRef }: RootNavigatorProps) => {
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
    <NavigationContainer ref={navigationRef} onReady={onReady}>
      <Stack.Navigator
        initialRouteName={initialRouteName}
        screenOptions={{
          headerShown: false,
          animation: 'ios_from_right',
          gestureEnabled: true,
          fullScreenGestureEnabled: true,
          presentation: 'card',
        }}>
        <Stack.Screen name="Splash" component={SplashScreen} />
        <Stack.Screen name="Home" component={HomeScreen} />
        <Stack.Screen name="SubjectForm" component={SubjectFormScreen} />
        <Stack.Screen name="SavedRecords" component={SavedRecordsScreen} />
        <Stack.Screen name="SubjectPerformance" component={SubjectPerformanceScreen} />
        <Stack.Screen name="AICoach" component={AICoachScreen} />
        <Stack.Screen name="LiveTalk" component={LiveTalkScreen} />
        <Stack.Screen name="Notifications" component={NotificationsScreen} />
        <Stack.Screen name="Updates" component={UpdatesScreen} />
        <Stack.Screen name="MyTasks" component={MyTasksScreen} />
        <Stack.Screen name="AboutApp" component={AboutScreen} />
        <Stack.Screen name="AboutDetail" component={AboutDetailScreen} />
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
