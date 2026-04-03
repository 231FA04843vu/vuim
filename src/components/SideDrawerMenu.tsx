import React, {useEffect, useRef} from 'react';
import {
  Alert,
  Animated,
  Pressable,
  StyleSheet,
  Text,
  TouchableWithoutFeedback,
  View,
} from 'react-native';
import {NavigationProp} from '@react-navigation/native';
import {useSubjects} from '../context/SubjectsContext';
import {Palette} from '../theme';
import {RootStackParamList} from '../navigation/types';
import {notify} from '../utils/notify';
import {ThemeMode} from '../types';

type Props = {
  visible: boolean;
  onClose: () => void;
  palette: Palette;
  navigation: NavigationProp<RootStackParamList>;
};

const SideDrawerMenu = ({visible, onClose, palette, navigation}: Props) => {
  const {themeMode, setThemeMode, resetRecords} = useSubjects();
  const translateX = useRef(new Animated.Value(-320)).current;
  const overlayOpacity = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(translateX, {
        toValue: visible ? 0 : -320,
        duration: 250,
        useNativeDriver: true,
      }),
      Animated.timing(overlayOpacity, {
        toValue: visible ? 1 : 0,
        duration: 230,
        useNativeDriver: true,
      }),
    ]).start();
  }, [overlayOpacity, translateX, visible]);

  const goTo = (screen: keyof RootStackParamList) => {
    navigation.navigate(screen as never);
    onClose();
  };

  const confirmReset = () => {
    Alert.alert('Reset All Data', 'Delete all saved subjects and results?', [
      {text: 'Cancel', style: 'cancel'},
      {
        text: 'Reset',
        style: 'destructive',
        onPress: async () => {
          await resetRecords();
          notify('All records cleared');
          goTo('Home');
        },
      },
    ]);
  };

  const themeOptions: Array<{mode: ThemeMode; label: string}> = [
    {mode: 'system', label: 'System'},
    {mode: 'light', label: 'Light'},
    {mode: 'dark', label: 'Dark'},
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
            backgroundColor: palette.surface,
            borderColor: palette.cardBorder,
            transform: [{translateX}],
          },
        ]}>
        <Text style={[styles.title, {color: palette.textPrimary}]}>Vignan Calculator</Text>
        <Text style={[styles.subtitle, {color: palette.textSecondary}]}>Navigation</Text>

        <Pressable style={[styles.item, {borderColor: palette.cardBorder}]} onPress={() => goTo('Home')}>
          <Text style={[styles.itemText, {color: palette.textPrimary}]}>Home</Text>
        </Pressable>
        <Pressable style={[styles.item, {borderColor: palette.cardBorder}]} onPress={() => goTo('SubjectForm')}>
          <Text style={[styles.itemText, {color: palette.textPrimary}]}>Add Subject</Text>
        </Pressable>
        <Pressable style={[styles.item, {borderColor: palette.cardBorder}]} onPress={() => goTo('SavedRecords')}>
          <Text style={[styles.itemText, {color: palette.textPrimary}]}>Saved Records</Text>
        </Pressable>
        <Pressable style={[styles.item, {borderColor: palette.cardBorder}]} onPress={() => goTo('AboutApp')}>
          <Text style={[styles.itemText, {color: palette.textPrimary}]}>About App</Text>
        </Pressable>

        <View style={styles.settingsBlock}>
          <Text style={[styles.sectionLabel, {color: palette.textSecondary}]}>Settings</Text>
          <Text style={[styles.itemText, {color: palette.textPrimary}]}>Theme</Text>
          <View style={styles.themeOptionsRow}>
            {themeOptions.map(option => {
              const selected = themeMode === option.mode;
              return (
                <Pressable
                  key={option.mode}
                  style={[
                    styles.themeOption,
                    {
                      borderColor: selected ? palette.accent : palette.cardBorder,
                      backgroundColor: selected ? palette.accentSoft : palette.backgroundAlt,
                    },
                  ]}
                  onPress={() => setThemeMode(option.mode)}>
                  <Text
                    style={[
                      styles.themeOptionText,
                      {color: selected ? palette.accent : palette.textPrimary},
                    ]}>
                    {option.label}
                  </Text>
                </Pressable>
              );
            })}
          </View>
        </View>

        <Pressable style={[styles.reset, {borderColor: palette.danger}]} onPress={confirmReset}>
          <Text style={[styles.resetText, {color: palette.danger}]}>Reset All Data</Text>
        </Pressable>
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
    backgroundColor: 'rgba(5, 10, 20, 0.42)',
  },
  panel: {
    width: 320,
    height: '100%',
    borderRightWidth: 1,
    paddingHorizontal: 20,
    paddingTop: 70,
  },
  title: {
    fontSize: 28,
    fontWeight: '900',
  },
  subtitle: {
    marginTop: 8,
    marginBottom: 16,
    fontSize: 11,
    letterSpacing: 1.4,
    textTransform: 'uppercase',
  },
  item: {
    paddingVertical: 14,
    borderBottomWidth: 1,
  },
  itemText: {
    fontSize: 14,
    fontWeight: '800',
    letterSpacing: 0.3,
  },
  settingsBlock: {
    marginTop: 18,
  },
  sectionLabel: {
    marginBottom: 6,
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 0.8,
    textTransform: 'uppercase',
  },
  themeOptionsRow: {
    marginTop: 10,
    flexDirection: 'row',
    gap: 8,
  },
  themeOption: {
    flex: 1,
    borderWidth: 1,
    borderRadius: 12,
    paddingVertical: 10,
    alignItems: 'center',
  },
  themeOptionText: {
    fontSize: 12,
    fontWeight: '800',
    letterSpacing: 0.3,
    textTransform: 'uppercase',
  },
  reset: {
    marginTop: 26,
    borderWidth: 1,
    borderRadius: 16,
    paddingVertical: 14,
    alignItems: 'center',
  },
  resetText: {
    fontSize: 12,
    fontWeight: '800',
    letterSpacing: 0.8,
    textTransform: 'uppercase',
  },
});

export default SideDrawerMenu;
