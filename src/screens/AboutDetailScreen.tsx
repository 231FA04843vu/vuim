import React from 'react';
import {Platform, Pressable, ScrollView, StyleSheet, Text, View} from 'react-native';
import {NativeStackScreenProps} from '@react-navigation/native-stack';
import {useSafeAreaInsets} from 'react-native-safe-area-context';
import Ionicons from '@react-native-vector-icons/ionicons';
import AnimatedGradientBackground from '../components/AnimatedGradientBackground';
import {useSubjects} from '../context/SubjectsContext';
import {RootStackParamList} from '../navigation/types';
import {darkPalette, lightPalette, typography} from '../theme';

type Props = NativeStackScreenProps<RootStackParamList, 'AboutDetail'>;

const AboutDetailScreen = ({navigation, route}: Props) => {
  const insets = useSafeAreaInsets();
  const {isDarkMode} = useSubjects();
  const palette = isDarkMode ? darkPalette : lightPalette;

  return (
    <View style={styles.container}>
      <AnimatedGradientBackground palette={palette} />
      <ScrollView contentContainerStyle={[styles.content, {paddingTop: Math.max(18, insets.top + 8)}]}>
        <View style={styles.headerRow}>
          <Pressable
            onPress={() => navigation.goBack()}
            style={[styles.backButton, {backgroundColor: palette.backgroundAlt, borderColor: palette.cardBorder}]}>
            <Ionicons name="chevron-back" size={18} color={palette.textPrimary} />
          </Pressable>
          <Text style={[styles.title, {color: palette.textPrimary}]}>{route.params.title}</Text>
        </View>

        <Text style={[styles.body, {color: palette.textSecondary}]}>{route.params.content}</Text>
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    paddingHorizontal: 20,
    paddingBottom: 32,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 14,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 12,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: {
    flex: 1,
    fontSize: 28,
    lineHeight: 34,
    fontFamily: Platform.select(typography.display),
    fontWeight: '700',
  },
  body: {
    fontSize: 19,
    lineHeight: 34,
    fontFamily: Platform.select(typography.body),
    fontWeight: '500',
    textAlign: 'left',
    paddingBottom: 10,
  },
});

export default AboutDetailScreen;
