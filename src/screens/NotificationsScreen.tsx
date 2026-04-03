import React from 'react';
import {Platform, Pressable, ScrollView, StyleSheet, Text, View} from 'react-native';
import {NativeStackScreenProps} from '@react-navigation/native-stack';
import {useSafeAreaInsets} from 'react-native-safe-area-context';
import AnimatedGradientBackground from '../components/AnimatedGradientBackground';
import GlassCard from '../components/GlassCard';
import HamburgerButton from '../components/HamburgerButton';
import SideDrawerMenu from '../components/SideDrawerMenu';
import {useNotifications} from '../context/NotificationsContext';
import {useSubjects} from '../context/SubjectsContext';
import {RootStackParamList} from '../navigation/types';
import {darkPalette, lightPalette, typography} from '../theme';

type Props = NativeStackScreenProps<RootStackParamList, 'Notifications'>;

const NotificationsScreen = ({navigation}: Props) => {
  const insets = useSafeAreaInsets();
  const {isDarkMode} = useSubjects();
  const {notifications, unreadCount, markAllAsRead, clearNotifications} = useNotifications();
  const palette = isDarkMode ? darkPalette : lightPalette;
  const [menuVisible, setMenuVisible] = React.useState(false);

  const markRead = async () => {
    await markAllAsRead();
  };

  const clearAll = async () => {
    await clearNotifications();
  };

  return (
    <View style={styles.container}>
      <AnimatedGradientBackground palette={palette} />
      <ScrollView contentContainerStyle={[styles.content, {paddingTop: Math.max(18, insets.top + 8)}]}>
        <View style={styles.topRow}>
          <HamburgerButton palette={palette} isDarkMode={isDarkMode} onPress={() => setMenuVisible(true)} />
          <View>
            <Text style={[styles.overline, {color: palette.textSecondary}]}>Alerts</Text>
            <Text style={[styles.title, {color: palette.textPrimary}]}>Notifications</Text>
            <Text style={[styles.subtitle, {color: palette.textMuted}]}>Unread: {unreadCount}</Text>
          </View>
        </View>

        <View style={styles.actionsRow}>
          <Pressable
            style={[styles.actionBtn, {borderColor: palette.cardBorder, backgroundColor: palette.surface}]}
            onPress={markRead}>
            <Text style={[styles.actionText, {color: palette.textPrimary}]}>Mark All Read</Text>
          </Pressable>
          <Pressable
            style={[styles.actionBtn, {borderColor: palette.danger, backgroundColor: 'rgba(220, 38, 38, 0.1)'}]}
            onPress={clearAll}>
            <Text style={[styles.actionText, {color: palette.danger}]}>Clear</Text>
          </Pressable>
        </View>

        {notifications.map(item => (
          <GlassCard key={item.id} palette={palette} style={styles.card}>
            <View style={styles.rowTop}>
              <Text style={[styles.cardTitle, {color: palette.textPrimary}]}>{item.title}</Text>
              {!item.read && <View style={[styles.dot, {backgroundColor: palette.accent}]} />}
            </View>
            <Text style={[styles.cardBody, {color: palette.textSecondary}]}>{item.message}</Text>
            <Text style={[styles.meta, {color: palette.textMuted}]}>
              {item.category.toUpperCase()} - {new Date(item.createdAt).toLocaleString()}
            </Text>
          </GlassCard>
        ))}

        {notifications.length === 0 && (
          <GlassCard palette={palette} style={styles.card}>
            <Text style={[styles.cardTitle, {color: palette.textPrimary}]}>No notifications yet</Text>
            <Text style={[styles.cardBody, {color: palette.textSecondary}]}>Update checks and AI responses will appear here.</Text>
          </GlassCard>
        )}
      </ScrollView>

      <SideDrawerMenu
        visible={menuVisible}
        onClose={() => setMenuVisible(false)}
        palette={palette}
        navigation={navigation}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    paddingHorizontal: 20,
    paddingBottom: 44,
  },
  topRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
    marginBottom: 14,
  },
  overline: {
    fontSize: 11,
    fontFamily: Platform.select(typography.heading),
    fontWeight: '700',
    letterSpacing: 0.8,
    textTransform: 'uppercase',
  },
  title: {
    marginTop: 6,
    fontSize: 30,
    lineHeight: 36,
    fontFamily: Platform.select(typography.display),
    fontWeight: '700',
  },
  subtitle: {
    marginTop: 4,
    fontSize: 14,
    lineHeight: 20,
    fontFamily: Platform.select(typography.body),
  },
  actionsRow: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 12,
  },
  actionBtn: {
    borderWidth: 1,
    borderRadius: 999,
    paddingVertical: 9,
    paddingHorizontal: 14,
  },
  actionText: {
    fontSize: 11,
    fontFamily: Platform.select(typography.heading),
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.4,
  },
  card: {
    marginBottom: 10,
  },
  rowTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: 8,
  },
  cardTitle: {
    flex: 1,
    fontSize: 16,
    fontFamily: Platform.select(typography.heading),
    fontWeight: '700',
  },
  cardBody: {
    marginTop: 6,
    fontSize: 14,
    lineHeight: 20,
    fontFamily: Platform.select(typography.body),
  },
  meta: {
    marginTop: 8,
    fontSize: 11,
    fontFamily: Platform.select(typography.heading),
    fontWeight: '700',
    letterSpacing: 0.4,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
});

export default NotificationsScreen;
