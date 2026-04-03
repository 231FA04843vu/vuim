import React, {useRef} from 'react';
import {Animated, Platform, Pressable, StyleSheet, Text, View} from 'react-native';
import {Palette, typography} from '../theme';
import {SubjectRecord} from '../types';
import AnimatedProgressBar from './AnimatedProgressBar';
import GlassCard from './GlassCard';

type Props = {
  item: SubjectRecord;
  palette: Palette;
  showCoachTag: boolean;
  onPress: (subjectName: string) => void;
  onEdit: (id: string) => void;
  onDelete: (id: string) => void;
};

const SubjectCard = ({item, palette, showCoachTag, onPress, onEdit, onDelete}: Props) => {
  const scale = useRef(new Animated.Value(1)).current;

  const animateTo = (value: number) => {
    Animated.spring(scale, {
      toValue: value,
      useNativeDriver: true,
      speed: 25,
      bounciness: 5,
    }).start();
  };

  return (
    <Animated.View style={{transform: [{scale}]}}>
      <Pressable
        onPress={() => onPress(item.subjectName)}
        onPressIn={() => animateTo(0.985)}
        onPressOut={() => animateTo(1)}
        android_ripple={{color: 'rgba(255, 255, 255, 0.25)'}}>
        <GlassCard palette={palette} style={styles.card}>
          <View style={styles.rowTop}>
            <View style={styles.leftBlock}>
              <Text style={[styles.title, {color: palette.textPrimary}]} numberOfLines={1}>
                {item.subjectName}
              </Text>
              <View style={styles.metaRow}>
                <View style={[styles.moduleChip, {backgroundColor: palette.accentSoft}]}>
                  <Text style={[styles.module, {color: palette.accent}]}>{item.module}</Text>
                </View>
                {showCoachTag && (
                  <View style={[styles.coachChip, {backgroundColor: 'rgba(220, 38, 38, 0.12)'}]}>
                    <Text style={[styles.coachText, {color: palette.danger}]}>Coach</Text>
                  </View>
                )}
              </View>
            </View>
            <View style={styles.rightBlock}>
              <Text style={[styles.total, {color: palette.textPrimary}]}>{item.total.toFixed(2)} / 60</Text>
              <Text style={[styles.percent, {color: palette.textSecondary}]}>{item.percentage.toFixed(2)}%</Text>
            </View>
          </View>

          <AnimatedProgressBar percentage={item.percentage} palette={palette} />

          <View style={styles.actions}>
            <Pressable
              android_ripple={{color: 'rgba(0, 114, 214, 0.2)'}}
              style={[styles.actionButton, {borderColor: palette.accent, backgroundColor: palette.accentSoft}]}
              onPress={event => {
                event.stopPropagation();
                onEdit(item.id);
              }}>
              <Text style={[styles.actionText, {color: palette.accent}]}>Edit</Text>
            </Pressable>
            <Pressable
              android_ripple={{color: 'rgba(220, 38, 38, 0.2)'}}
              style={[styles.actionButton, {borderColor: palette.danger, backgroundColor: 'rgba(220, 38, 38, 0.08)'}]}
              onPress={event => {
                event.stopPropagation();
                onDelete(item.id);
              }}>
              <Text style={[styles.actionText, {color: palette.danger}]}>Delete</Text>
            </Pressable>
          </View>
        </GlassCard>
      </Pressable>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  card: {
    marginBottom: 16,
  },
  rowTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 14,
    gap: 12,
  },
  leftBlock: {
    flex: 1,
    minWidth: 0,
  },
  rightBlock: {
    width: 116,
    alignItems: 'flex-end',
  },
  title: {
    fontSize: 19,
    fontFamily: Platform.select(typography.heading),
    fontWeight: '700',
    lineHeight: 24,
  },
  moduleChip: {
    alignSelf: 'flex-start',
    marginTop: 8,
    borderRadius: 999,
    paddingHorizontal: 12,
    paddingVertical: 5,
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginTop: 8,
    flexWrap: 'wrap',
  },
  module: {
    fontSize: 11,
    fontFamily: Platform.select(typography.heading),
    fontWeight: '700',
    letterSpacing: 0.5,
    textTransform: 'uppercase',
  },
  coachChip: {
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 5,
  },
  coachText: {
    fontSize: 11,
    fontFamily: Platform.select(typography.heading),
    fontWeight: '700',
    letterSpacing: 0.4,
    textTransform: 'uppercase',
  },
  total: {
    fontSize: 17,
    fontFamily: Platform.select(typography.heading),
    fontWeight: '700',
    textAlign: 'right',
    lineHeight: 22,
  },
  percent: {
    marginTop: 4,
    fontSize: 13,
    fontFamily: Platform.select(typography.body),
    textAlign: 'right',
    lineHeight: 18,
  },
  actions: {
    marginTop: 16,
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 10,
  },
  actionButton: {
    borderRadius: 14,
    borderWidth: 1,
    paddingHorizontal: 16,
    paddingVertical: 9,
    overflow: 'hidden',
  },
  actionText: {
    fontSize: 12,
    fontFamily: Platform.select(typography.heading),
    fontWeight: '700',
    letterSpacing: 0.5,
    textTransform: 'uppercase',
  },
});

export default SubjectCard;
