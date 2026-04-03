import {CoachTimeBlock} from '../types';

let notificationsEnabled = true;
let appIsActive = true;

export const setMobileNotificationsEnabled = (enabled: boolean) => {
  notificationsEnabled = enabled;
};

export const getMobileNotificationsEnabled = () => notificationsEnabled;

export const setAppIsActive = (active: boolean) => {
  appIsActive = active;
};

export const getAppIsActive = () => appIsActive;

export const requestMobileNotificationPermission = async () => true;

export const sendMobileNotification = async (_title: string, _body: string) => {
  if (!notificationsEnabled || appIsActive) {
    return;
  }
};

export const clearScheduledStudyNotifications = async () => {
  return;
};

export const clearScheduledPlanNotifications = async () => {
  return;
};

export const scheduleStudyNotifications = async (_timetable: CoachTimeBlock[]) => {
  if (!notificationsEnabled) {
    return 0;
  }
  return 0;
};

export const schedulePlanTaskNotifications = async (_tasks: string[]) => {
  if (!notificationsEnabled) {
    return 0;
  }
  return 0;
};
