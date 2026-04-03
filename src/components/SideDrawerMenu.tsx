import React, {useEffect, useRef} from 'react';
import {
  Alert,
  Animated,
  Pressable,
  StyleSheet,
  Switch,
  Text,
  TouchableWithoutFeedback,
  View,
} from 'react-native';
import {NavigationProp} from '@react-navigation/native';
import {useSubjects} from '../context/SubjectsContext';
import {Palette} from '../theme';
import {RootStackParamList} from '../navigation/types';
import {notify} from '../utils/notify';

type Props = {
  visible: boolean;
  onClose: () => void;
  palette: Palette;
  navigation: NavigationProp<RootStackParamList>;
};

const SideDrawerMenu = ({visible, onClose, palette, navigation}: Props) => {
  const {isDarkMode, toggleTheme, resetRecords} = useSubjects();
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

        <View style={styles.themeRow}>
          <Text style={[styles.itemText, {color: palette.textPrimary}]}>Dark Mode</Text>
          <Switch value={isDarkMode} onValueChange={toggleTheme} />
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
  themeRow: {
    marginTop: 18,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
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
