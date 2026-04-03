import React, {createContext, useCallback, useContext, useMemo, useState} from 'react';
import {AppNotification, NotificationCategory} from '../types';

type AddNotificationInput = {
  title: string;
  message: string;
  category: NotificationCategory;
};

type NotificationsContextType = {
  notifications: AppNotification[];
  unreadCount: number;
  systemNotificationsEnabled: boolean;
  inAppNotificationsEnabled: boolean;
  addNotification: (input: AddNotificationInput) => Promise<void>;
  markAllAsRead: () => Promise<void>;
  clearNotifications: () => Promise<void>;
  setSystemNotificationsEnabled: (enabled: boolean) => Promise<void>;
  setInAppNotificationsEnabled: (enabled: boolean) => Promise<void>;
  resetNotificationSettings: () => void;
};

const NotificationsContext = createContext<NotificationsContextType | undefined>(undefined);

const newId = () => `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;

export const NotificationsProvider = ({children}: {children: React.ReactNode}) => {
  const [notifications, setNotifications] = useState<AppNotification[]>([]);
  const [systemNotificationsEnabled, setSystemNotificationsEnabledState] = useState(true);
  const [inAppNotificationsEnabled, setInAppNotificationsEnabledState] = useState(true);

  const addNotification = useCallback(
    async ({title, message, category}: AddNotificationInput) => {
      if (!inAppNotificationsEnabled) {
        return;
      }

      const next: AppNotification[] = [
        {
          id: newId(),
          title,
          message,
          category,
          createdAt: new Date().toISOString(),
          read: false,
        },
        ...notifications,
      ].slice(0, 120);

      setNotifications(next);
    },
    [inAppNotificationsEnabled, notifications],
  );

  const markAllAsRead = useCallback(async () => {
    setNotifications(prev => prev.map(item => ({...item, read: true})));
  }, []);

  const clearNotifications = useCallback(async () => {
    setNotifications([]);
  }, []);

  const setSystemNotificationsEnabled = useCallback(async (enabled: boolean) => {
    setSystemNotificationsEnabledState(enabled);
  }, []);

  const setInAppNotificationsEnabled = useCallback(async (enabled: boolean) => {
    setInAppNotificationsEnabledState(enabled);
  }, []);

  const resetNotificationSettings = useCallback(() => {
    setSystemNotificationsEnabledState(true);
    setInAppNotificationsEnabledState(true);
  }, []);

  const unreadCount = useMemo(
    () => notifications.reduce((acc, item) => (item.read ? acc : acc + 1), 0),
    [notifications],
  );

  const value = useMemo(
    () => ({
      notifications,
      unreadCount,
      systemNotificationsEnabled,
      inAppNotificationsEnabled,
      addNotification,
      markAllAsRead,
      clearNotifications,
      setSystemNotificationsEnabled,
      setInAppNotificationsEnabled,
      resetNotificationSettings,
    }),
    [
      notifications,
      unreadCount,
      systemNotificationsEnabled,
      inAppNotificationsEnabled,
      addNotification,
      markAllAsRead,
      clearNotifications,
      setSystemNotificationsEnabled,
      setInAppNotificationsEnabled,
      resetNotificationSettings,
    ],
  );

  return <NotificationsContext.Provider value={value}>{children}</NotificationsContext.Provider>;
};

export const useNotifications = () => {
  const ctx = useContext(NotificationsContext);
  if (!ctx) {
    throw new Error('useNotifications must be used within NotificationsProvider');
  }
  return ctx;
};
