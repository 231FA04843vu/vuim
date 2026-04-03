import React, {useEffect, useRef} from 'react';
import {
  Animated,
  Alert,
  Linking,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  TouchableWithoutFeedback,
  View,
} from 'react-native';
import {NavigationProp} from '@react-navigation/native';
import Ionicons from '@react-native-vector-icons/ionicons';
import {useNotifications} from '../context/NotificationsContext';
import {useSubjects} from '../context/SubjectsContext';
import {Palette, typography} from '../theme';
import {RootStackParamList} from '../navigation/types';
import {notify} from '../utils/notify';

type Props = {
  visible: boolean;
  onClose: () => void;
  palette: Palette;
  navigation: NavigationProp<RootStackParamList>;
};

const SideDrawerMenu = ({visible, onClose, palette, navigation}: Props) => {
  const {
    systemNotificationsEnabled,
    inAppNotificationsEnabled,
    setSystemNotificationsEnabled,
    setInAppNotificationsEnabled,
  } = useNotifications();
  const {themeMode, setThemeMode, clearCache, clearData, toggleTheme} = useSubjects();
  const translateX = useRef(new Animated.Value(-320)).current;
  const overlayOpacity = useRef(new Animated.Value(0)).current;
  const [releaseVersion, setReleaseVersion] = React.useState('v1.3.5');

  useEffect(() => {
    Animated.parallel([
      Animated.timing(translateX, {
        toValue: visible ? 0 : -320,
        duration: 290,
        useNativeDriver: true,
      }),
      Animated.timing(overlayOpacity, {
        toValue: visible ? 1 : 0,
        duration: 260,
        useNativeDriver: true,
      }),
    ]).start();
  }, [overlayOpacity, translateX, visible]);

  useEffect(() => {
    const loadReleaseVersion = async () => {
      try {
        const response = await fetch('https://api.github.com/repos/231FA04843vu/vuim/releases/latest');
        if (!response.ok) {
          return;
        }

        const data = (await response.json()) as {tag_name?: string; name?: string};
        const tag = (data.tag_name ?? data.name ?? '').trim();
        if (tag) {
          setReleaseVersion(tag.startsWith('v') ? tag : `v${tag}`);
        }
      } catch {
        // Keep fallback release tag.
      }
    };

    loadReleaseVersion();
  }, []);

  const goTo = (screen: keyof RootStackParamList) => {
    navigation.navigate(screen as never);
    onClose();
  };

  const openRepo = async () => {
    try {
      await Linking.openURL('https://github.com/231FA04843vu/vuim');
      onClose();
    } catch {
      notify('Unable to open repository link');
    }
  };

  const confirmClearData = () => {
    Alert.alert('Clear data?', 'This removes your saved subject records. This cannot be undone.', [
      {text: 'Cancel', style: 'cancel'},
      {
        text: 'Clear data',
        style: 'destructive',
        onPress: async () => {
          await clearData();
          onClose();
        },
      },
    ]);
  };

  const confirmClearCache = () => {
    Alert.alert('Clear cache?', 'This resets preferences, notification settings, and cached AI data.', [
      {text: 'Cancel', style: 'cancel'},
      {
        text: 'Clear cache',
        style: 'destructive',
        onPress: async () => {
          await clearCache();
          onClose();
        },
      },
    ]);
  };

  const navItem = (label: string, icon: React.ComponentProps<typeof Ionicons>['name'], screen: keyof RootStackParamList) => (
    <Pressable style={[styles.item, {borderColor: palette.cardBorder}]} onPress={() => goTo(screen)}>
      <View style={styles.itemRow}>
        <View style={[styles.itemIconWrap, {backgroundColor: palette.accentSoft}]}> 
          <Ionicons name={icon} size={18} color={palette.accent} />
        </View>
        <Text style={[styles.itemText, {color: palette.textPrimary}]}>{label}</Text>
      </View>
    </Pressable>
  );

  const themeOptions: Array<{label: string; value: 'system' | 'light' | 'dark'}> = [
    {label: 'System', value: 'system'},
    {label: 'Light', value: 'light'},
    {label: 'Dark', value: 'dark'},
  ];

  return (
    <View style={styles.root} pointerEvents={visible ? 'auto' : 'none'}>
      <TouchableWithoutFeedback onPress={onClose}>
        <Animated.View style={[styles.overlay, {opacity: overlayOpacity}]} />
      </TouchableWithoutFeedback>

      <Animated.View
        style={[
          styles.panel,
          {
            backgroundColor: palette.backgroundAlt,
            borderColor: palette.cardBorder,
            shadowColor: palette.shadow,
            transform: [{translateX}],
          },
        ]}>
        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
          <View style={styles.drawerContent}>
            <View>
              <Text style={[styles.sectionHeader, {color: palette.textSecondary}]}>Navigation</Text>
              {navItem('Home', 'home-outline', 'Home')}
              {navItem('My Tasks', 'list-outline', 'MyTasks')}
              {navItem('Saved Records', 'bookmark', 'SavedRecords')}
              {navItem('Notifications', 'notifications', 'Notifications')}
              {navItem('Updates', 'sync', 'Updates')}
            </View>

            <View style={styles.bottomBlock}>
              <Text style={[styles.sectionHeader, {color: palette.textSecondary}]}>Settings</Text>
              <View style={[styles.settingRow, {borderColor: palette.cardBorder}]}>
                <View style={styles.settingTextWrap}>
                  <Text style={[styles.settingTitle, {color: palette.textPrimary}]}>System notifications</Text>
                  <Text style={[styles.settingSub, {color: palette.textMuted}]}>{systemNotificationsEnabled ? 'On' : 'Off'}</Text>
                </View>
                <Switch
                  value={systemNotificationsEnabled}
                  onValueChange={async value => {
                    await setSystemNotificationsEnabled(value);
                  }}
                  trackColor={{false: palette.cardBorder, true: palette.accentSoft}}
                  thumbColor={systemNotificationsEnabled ? palette.accent : '#F3F4F6'}
                />
              </View>

              <View style={[styles.settingRow, {borderColor: palette.cardBorder}]}>
                <View style={styles.settingTextWrap}>
                  <Text style={[styles.settingTitle, {color: palette.textPrimary}]}>In-app notifications</Text>
                  <Text style={[styles.settingSub, {color: palette.textMuted}]}>{inAppNotificationsEnabled ? 'On' : 'Off'}</Text>
                </View>
                <Switch
                  value={inAppNotificationsEnabled}
                  onValueChange={async value => {
                    await setInAppNotificationsEnabled(value);
                  }}
                  trackColor={{false: palette.cardBorder, true: palette.accentSoft}}
                  thumbColor={inAppNotificationsEnabled ? palette.accent : '#F3F4F6'}
                />
              </View>

              <View style={[styles.themeBlock, {borderColor: palette.cardBorder}]}> 
                <View style={styles.themeHeaderRow}>
                  <Text style={[styles.settingTitle, {color: palette.textPrimary}]}>Theme</Text>
                  <Pressable onPress={toggleTheme}>
                    <Text style={[styles.themeQuickAction, {color: palette.accent}]}>Toggle</Text>
                  </Pressable>
                </View>
                <View style={styles.themeChoiceRow}>
                  {themeOptions.map(option => {
                    const active = themeMode === option.value;
                    return (
                      <Pressable
                        key={option.value}
                        style={[
                          styles.themeChoice,
                          {
                            borderColor: active ? palette.accent : palette.cardBorder,
                            backgroundColor: active ? palette.accentSoft : 'transparent',
                          },
                        ]}
                        onPress={async () => {
                          await setThemeMode(option.value);
                        }}>
                        <Text style={[styles.themeChoiceText, {color: active ? palette.textPrimary : palette.textSecondary}]}> 
                          {option.label}
                        </Text>
                      </Pressable>
                    );
                  })}
                </View>
              </View>

              <Pressable style={[styles.item, {borderColor: palette.cardBorder}]} onPress={openRepo}>
                <View style={styles.itemRow}>
                  <View style={[styles.itemIconWrap, {backgroundColor: palette.accentSoft}]}> 
                    <Ionicons name="logo-github" size={16} color={palette.accent} />
                  </View>
                  <Text style={[styles.itemText, {color: palette.textPrimary}]}>GitHub Repo</Text>
                </View>
              </Pressable>
              <Pressable style={[styles.item, {borderColor: palette.cardBorder}]} onPress={() => goTo('AboutApp')}>
                <View style={styles.itemRow}>
                  <View style={[styles.itemIconWrap, {backgroundColor: palette.accentSoft}]}> 
                    <Ionicons name="information-circle" size={18} color={palette.accent} />
                  </View>
                  <Text style={[styles.itemText, {color: palette.textPrimary}]}>About App</Text>
                </View>
              </Pressable>

              <View style={styles.dangerBlock}>
                <Pressable style={[styles.dangerItem, {borderColor: palette.cardBorder}]} onPress={confirmClearData}>
                  <View style={styles.itemRow}>
                    <View style={[styles.itemIconWrap, {backgroundColor: 'rgba(220, 38, 38, 0.12)'}]}>
                      <Ionicons name="trash-outline" size={18} color={palette.danger} />
                    </View>
                    <Text style={[styles.dangerText, {color: palette.danger}]}>Clear Data</Text>
                  </View>
                </Pressable>
                <Pressable style={[styles.dangerItem, {borderColor: palette.cardBorder}]} onPress={confirmClearCache}>
                  <View style={styles.itemRow}>
                    <View style={[styles.itemIconWrap, {backgroundColor: 'rgba(234, 88, 12, 0.12)'}]}>
                      <Ionicons name="refresh-circle-outline" size={18} color={palette.warning} />
                    </View>
                    <Text style={[styles.dangerText, {color: palette.warning}]}>Clear Cache</Text>
                  </View>
                </Pressable>
              </View>
            </View>

            <View style={styles.releaseFooter}>
              <Text style={[styles.releaseLabel, {color: palette.textSecondary}]}>Git Release</Text>
              <Text style={[styles.releaseValue, {color: palette.textPrimary}]}>{releaseVersion}</Text>
            </View>
          </View>
        </ScrollView>
      </Animated.View>
    </View>
  );
};

const styles = StyleSheet.create({
  root: {
    ...StyleSheet.absoluteFillObject,
    zIndex: 50,
  },
  overlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(7, 14, 25, 0.3)',
  },
  panel: {
    width: 320,
    height: '100%',
    borderRightWidth: 1,
    borderTopRightRadius: 24,
    borderBottomRightRadius: 24,
    paddingHorizontal: 20,
    paddingTop: 70,
    shadowOpacity: 0.24,
    shadowRadius: 24,
    shadowOffset: {width: 4, height: 0},
    elevation: 10,
  },
  scrollContent: {
    paddingBottom: 30,
    flexGrow: 1,
  },
  drawerContent: {
    flex: 1,
    justifyContent: 'space-between',
  },
  bottomBlock: {
    paddingTop: 18,
  },
  releaseFooter: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingTop: 18,
    paddingBottom: 8,
  },
  releaseLabel: {
    fontSize: 10,
    fontFamily: Platform.select(typography.heading),
    fontWeight: '700',
    letterSpacing: 1,
    textTransform: 'uppercase',
    marginBottom: 4,
  },
  releaseValue: {
    fontSize: 14,
    fontFamily: Platform.select(typography.heading),
    fontWeight: '700',
  },
  sectionHeader: {
    marginTop: 18,
    fontSize: 11,
    fontFamily: Platform.select(typography.heading),
    fontWeight: '700',
    letterSpacing: 1,
    textTransform: 'uppercase',
    marginBottom: 8,
  },
  item: {
    paddingVertical: 14,
    borderBottomWidth: 1,
  },
  itemRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  itemIconWrap: {
    width: 30,
    height: 30,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  itemText: {
    fontSize: 14,
    fontFamily: Platform.select(typography.heading),
    fontWeight: '700',
    letterSpacing: 0.3,
  },
  settingRow: {
    borderWidth: 1,
    borderRadius: 14,
    paddingHorizontal: 12,
    paddingVertical: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  dangerBlock: {
    marginTop: 8,
  },
  themeBlock: {
    borderWidth: 1,
    borderRadius: 14,
    paddingHorizontal: 12,
    paddingVertical: 12,
    marginBottom: 8,
  },
  themeHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 10,
  },
  themeQuickAction: {
    fontSize: 12,
    fontFamily: Platform.select(typography.heading),
    fontWeight: '700',
  },
  themeChoiceRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  themeChoice: {
    flexGrow: 1,
    minWidth: 84,
    borderWidth: 1,
    borderRadius: 999,
    paddingVertical: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  themeChoiceText: {
    fontSize: 12,
    fontFamily: Platform.select(typography.heading),
    fontWeight: '700',
  },
  dangerItem: {
    paddingVertical: 14,
    borderBottomWidth: 1,
  },
  dangerText: {
    fontSize: 14,
    fontFamily: Platform.select(typography.heading),
    fontWeight: '700',
    letterSpacing: 0.3,
  },
  settingTextWrap: {
    flex: 1,
    paddingRight: 12,
  },
  settingTitle: {
    fontSize: 14,
    fontFamily: Platform.select(typography.heading),
    fontWeight: '700',
  },
  settingSub: {
    marginTop: 3,
    fontSize: 12,
    fontFamily: Platform.select(typography.body),
  },
});

export default SideDrawerMenu;
