import React from 'react';
import {Platform, Pressable, StyleSheet, Text, View} from 'react-native';
import {NavigationProp} from '@react-navigation/native';
import {useSafeAreaInsets} from 'react-native-safe-area-context';
import {Palette, typography} from '../theme';
import {RootStackParamList} from '../navigation/types';

type NavScreen = Exclude<keyof RootStackParamList, 'Splash'>;

type Item = {
  key: NavScreen;
  label: string;
};

type Props = {
  palette: Palette;
  navigation: NavigationProp<RootStackParamList>;
  current: NavScreen;
};

const items: Item[] = [
  {key: 'Home', label: 'Home'},
  {key: 'SubjectForm', label: 'Add'},
  {key: 'SavedRecords', label: 'Records'},
  {key: 'Updates', label: 'Updates'},
];

const BottomNavBar = ({palette, navigation, current}: Props) => {
  const insets = useSafeAreaInsets();

  return (
    <View style={[styles.wrap, {bottom: Math.max(12, insets.bottom + 6)}]} pointerEvents="box-none">
      <View
        style={[
          styles.bar,
          {
            backgroundColor: palette.surface,
            borderColor: palette.cardBorder,
            shadowColor: palette.shadow,
          },
        ]}>
        {items.map(item => {
          const active = item.key === current;
          return (
            <Pressable
              key={item.key}
              style={[
                styles.item,
                {
                  backgroundColor: active ? palette.accentSoft : 'transparent',
                  borderColor: active ? palette.accent : 'transparent',
                },
              ]}
              android_ripple={{color: 'rgba(255,255,255,0.16)'}}
              onPress={() => {
                if (!active) {
                  navigation.navigate(item.key as never);
                }
              }}>
              <Text style={[styles.itemText, {color: active ? palette.accent : palette.textSecondary}]}>
                {item.label}
              </Text>
            </Pressable>
          );
        })}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  wrap: {
    position: 'absolute',
    left: 16,
    right: 16,
  },
  bar: {
    flexDirection: 'row',
    borderWidth: 1,
    borderRadius: 16,
    padding: 6,
    shadowOpacity: 0.1,
    shadowRadius: 14,
    shadowOffset: {width: 0, height: 5},
    elevation: 4,
  },
  item: {
    flex: 1,
    borderWidth: 1,
    borderRadius: 11,
    paddingVertical: 9,
    alignItems: 'center',
    justifyContent: 'center',
  },
  itemText: {
    fontSize: 10,
    fontFamily: Platform.select(typography.heading),
    fontWeight: '700',
    letterSpacing: 0.5,
    textTransform: 'uppercase',
  },
});

export default BottomNavBar;
