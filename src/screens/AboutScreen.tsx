import React from 'react';
import {Image, Platform, Pressable, ScrollView, StyleSheet, Text, View} from 'react-native';
import {NativeStackScreenProps} from '@react-navigation/native-stack';
import {useSafeAreaInsets} from 'react-native-safe-area-context';
import Ionicons from '@react-native-vector-icons/ionicons';
import {useSubjects} from '../context/SubjectsContext';
import AnimatedGradientBackground from '../components/AnimatedGradientBackground';
import {darkPalette, lightPalette, typography} from '../theme';
import {RootStackParamList} from '../navigation/types';
import HamburgerButton from '../components/HamburgerButton';
import SideDrawerMenu from '../components/SideDrawerMenu';

type Props = NativeStackScreenProps<RootStackParamList, 'AboutApp'>;

const localAppVersion = (require('../../package.json') as {version?: string}).version ?? '1.0.0';
const releaseMeta = require('../../app.json') as {expo?: {version?: string}};
const androidReleaseVersion = releaseMeta.expo?.version ?? '1.0.0';
const pkg = require('../../package.json') as {
  dependencies?: Record<string, string>;
  devDependencies?: Record<string, string>;
};

const AboutScreen = ({navigation}: Props) => {
  const insets = useSafeAreaInsets();
  const {isDarkMode} = useSubjects();
  const palette = isDarkMode ? darkPalette : lightPalette;
  const [menuVisible, setMenuVisible] = React.useState(false);
  const [releaseVersion, setReleaseVersion] = React.useState(localAppVersion);
  const androidDeviceRelease =
    Platform.OS === 'android' ? String((Platform.constants as {Release?: string}).Release ?? Platform.Version) : 'N/A';
  const securityPatch =
    Platform.OS === 'android'
      ? String((Platform.constants as {SecurityPatch?: string}).SecurityPatch ?? 'Unavailable on this device build')
      : 'N/A';
  const reactNativeVersion = pkg.dependencies?.['react-native'] ?? 'Unknown';
  const reactNavigationVersion = pkg.dependencies?.['@react-navigation/native'] ?? 'Unknown';
  const asyncStorageVersion = pkg.dependencies?.['@react-native-async-storage/async-storage'] ?? 'Unknown';
  const notifeeVersion = pkg.dependencies?.['@notifee/react-native'] ?? 'Unknown';
  const lottieVersion = pkg.dependencies?.['lottie-react-native'] ?? 'Unknown';

  React.useEffect(() => {
    const loadReleaseVersion = async () => {
      try {
        const response = await fetch('https://api.github.com/repos/231FA04843vu/vuim/releases/latest');
        if (!response.ok) {
          return;
        }

        const data = (await response.json()) as {tag_name?: string; name?: string};
        const tag = (data.tag_name ?? data.name ?? '').trim();
        if (tag) {
          setReleaseVersion(tag.replace(/^v/i, ''));
        }
      } catch {
        setReleaseVersion(localAppVersion);
      }
    };

    loadReleaseVersion();
  }, []);

  const termsContent = `
SECTION 1: SERVICE POSITIONING
VUIM is a companion application intended for internal academic estimation. It is not an official university publication, transcript generator, or institutional source of truth. All computed values are advisory and must be verified against official systems before academic submission.

SECTION 2: USER OBLIGATION
Users are responsible for the accuracy of entered data, including module selection, raw scores, and update decisions. Incorrect input, missing fields, or legacy marking pattern assumptions can change outputs materially.

SECTION 3: OPERATIONAL BOUNDARY
The app provides local calculations, record tracking, notification reminders, and update-aware utility flows. It does not promise grading policy synchronization with every curriculum change unless updated by the developer.

SECTION 4: CONFIGURATION DISCLOSURE
Application Name: VUIM
Application Package: com.vuim
App Version (JS): ${localAppVersion}
Release Version (App Config): ${androidReleaseVersion}
Runtime Android Version: ${androidDeviceRelease}
Security Patch Level: ${securityPatch}

SECTION 5: LIABILITY NOTE
Any academic action based on calculations should be validated through institution-provided records. VUIM is a productivity aid, not an adjudication tool.
`.trim();

  const privacyContent = `
SECTION 1: DATA STORAGE MODEL
VUIM stores operational records on-device for offline continuity and responsive access. No mandatory account sign-in is required for baseline usage.

SECTION 2: LOCAL STORAGE FOOTPRINT
Primary keys and cache domains used internally:
- @vuim/records (subject and marks records)
- @vuim/prefs (theme and preference state)
- @vuim/notifications (local notification history)
- @vuim/gemini_api_key (optional user-provided AI key)

SECTION 3: PROCESSING SCOPE
The app processes entered academic values for calculation and display workflows. Optional external integrations are user initiated and should only be used with non-sensitive content when possible.

SECTION 4: SECURITY DETAIL SNAPSHOT
Current Runtime Android Version: ${androidDeviceRelease}
Current Security Patch: ${securityPatch}
Permission-sensitive feature: local notifications via Notifee

SECTION 5: USER CONTROLS
You can clear records and cache separately in-app. Shared-device users should periodically clear data to reduce local exposure risk.
`.trim();

  const licensesContent = `
SECTION 1: OPEN SOURCE FOUNDATION
VUIM is built on community-maintained libraries and respects upstream licensing obligations.

SECTION 2: IMPLEMENTED PACKAGE SNAPSHOT
React Native: ${reactNativeVersion}
React Navigation: ${reactNavigationVersion}
AsyncStorage: ${asyncStorageVersion}
Notifee: ${notifeeVersion}
Lottie React Native: ${lottieVersion}

SECTION 3: LICENSE RESPONSIBILITY
Each dependency remains governed by its own license terms and copyright notices. This app acknowledges those terms and attributes framework ownership to original maintainers.

SECTION 4: PRACTICAL NOTE
When dependencies are updated, corresponding notices and obligations continue to apply according to upstream changes and versioned license files.
`.trim();

  const buildLogsContent = `
SECTION 1: BUILD PIPELINE OVERVIEW
Android builds run through Gradle with React Native integration. The pipeline includes dependency resolution, Java/Kotlin and JS integration tasks, resource merge, packaging, and APK install stages.

SECTION 2: ACTIVE BUILD CONFIGURATION SNAPSHOT
Application ID: com.vuim
Default Version Name: 1.0
Default Version Code: 1
Build Type Used For Testing: debug
Hermes Engine: enabled
Packaging Rule: pickFirst for **/libc++_shared.so

SECTION 3: NOTIFICATION CONFIGURATION SNAPSHOT
Notification Channel ID: vuim-main
Notification Channel Name: VUIM Alerts
Android Importance: HIGH
Small Icon Resource: ic_stat_vuim
Large Icon Resource: app_icon_notification

SECTION 4: DIAGNOSTIC USAGE
Build logs should be used to inspect task failures, compatibility warnings, dependency conflicts, and packaging anomalies. Release readiness should include successful install validation and runtime behavior checks on target API levels.
`.trim();

  const openDetail = (title: string, content: string) => {
    navigation.navigate('AboutDetail', {title, content});
  };

  return (
    <View style={styles.container}>
      <AnimatedGradientBackground palette={palette} />
      <ScrollView contentContainerStyle={[styles.content, {paddingTop: Math.max(18, insets.top + 8)}]}>
        <View style={styles.topRow}>
          <HamburgerButton palette={palette} onPress={() => setMenuVisible(true)} />
          <View>
            <Text style={[styles.overline, {color: palette.textSecondary}]}>About</Text>
            <Text style={[styles.pageTitle, {color: palette.textPrimary}]}>App Information</Text>
            <Text style={[styles.subtitle, {color: palette.textMuted}]}>Clear essentials only</Text>
          </View>
        </View>

        <View style={[styles.brandCard, {backgroundColor: palette.backgroundAlt, borderColor: palette.cardBorder}]}> 
          <Image source={require('../../assets/app-icon.png')} style={styles.appIcon} resizeMode="cover" />
          <View style={styles.brandTextWrap}>
            <Text style={[styles.appName, {color: palette.textPrimary}]}>VUIM</Text>
            <Text style={[styles.appTagline, {color: palette.textSecondary}]}>Vigan University Internal Marks</Text>
          </View>
        </View>

        <View style={[styles.sectionBlock, {borderColor: palette.cardBorder}]}> 
          <Text style={[styles.sectionTitle, {color: palette.textPrimary}]}>Version and Security</Text>
          <Text style={[styles.paragraph, {color: palette.textSecondary}]}>Android Version (Release): {androidReleaseVersion}. App Version (Git Release): {releaseVersion}. Device Android Runtime: {androidDeviceRelease}. Security Patch Level: {securityPatch}.</Text>
        </View>

        <View style={[styles.sectionBlock, {borderColor: palette.cardBorder}]}> 
          <Text style={[styles.sectionTitle, {color: palette.textPrimary}]}>Terms</Text>
          <Text style={[styles.paragraph, {color: palette.textSecondary}]}>This application is provided for academic support and estimation workflows. By using VUIM, users acknowledge responsibility for verifying official academic records from institutional portals before acting on any calculation shown in the app.</Text>
          <Pressable style={styles.linkParagraph} onPress={() => openDetail('Terms', termsContent)}>
            <Text style={[styles.linkText, {color: palette.accent}]}>Read Full Terms</Text>
          </Pressable>
        </View>

        <View style={[styles.sectionBlock, {borderColor: palette.cardBorder}]}> 
          <Text style={[styles.sectionTitle, {color: palette.textPrimary}]}>Privacy Policy</Text>
          <Text style={[styles.paragraph, {color: palette.textSecondary}]}>VUIM stores core records and preferences locally on device storage to support offline usage, and does not perform mandatory user-account tracking. Optional integrations are user-initiated and should be reviewed before sharing sensitive academic content.</Text>
          <Pressable style={styles.linkParagraph} onPress={() => openDetail('Privacy Policy', privacyContent)}>
            <Text style={[styles.linkText, {color: palette.accent}]}>Read Privacy Policy</Text>
          </Pressable>
        </View>

        <View style={[styles.sectionBlock, {borderColor: palette.cardBorder}]}> 
          <Text style={[styles.sectionTitle, {color: palette.textPrimary}]}>Open Source Licenses</Text>
          <Text style={[styles.paragraph, {color: palette.textSecondary}]}>This app is built with open-source components, including React Native, React Navigation, AsyncStorage, and Notifee, each distributed under their respective permissive licenses. License attributions and upstream notices are available through the repository documentation.</Text>
          <Pressable style={styles.linkParagraph} onPress={() => openDetail('Open Source Licenses', licensesContent)}>
            <Text style={[styles.linkText, {color: palette.accent}]}>View License Sources</Text>
          </Pressable>
        </View>

        <View style={[styles.sectionBlock, {borderColor: palette.cardBorder}]}> 
          <Text style={[styles.sectionTitle, {color: palette.textPrimary}]}>Build Logs</Text>
          <Text style={[styles.paragraph, {color: palette.textSecondary}]}>Release builds are generated through the Android Gradle pipeline and include dependency resolution, resource merge validation, bytecode packaging, and APK artifact installation steps. Build diagnostics include task-level execution details, compatibility warnings, and report references that can be reviewed for release verification, performance tracking, and troubleshooting across emulator and device distributions.</Text>
          <Pressable style={styles.linkParagraph} onPress={() => openDetail('Build Logs', buildLogsContent)}>
            <Text style={[styles.linkText, {color: palette.accent}]}>View Release Build History</Text>
          </Pressable>
        </View>

        <View style={[styles.devFooter, {borderColor: palette.cardBorder}]}> 
          <Ionicons name="ribbon" size={20} color={palette.accent} />
          <Text style={[styles.devText, {color: palette.textPrimary}]}>Developed by AVK</Text>
        </View>
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
    letterSpacing: 0.9,
    textTransform: 'uppercase',
  },
  pageTitle: {
    fontSize: 30,
    fontFamily: Platform.select(typography.display),
    fontWeight: '700',
    marginTop: 6,
    lineHeight: 36,
  },
  subtitle: {
    marginTop: 6,
    fontSize: 14,
    fontFamily: Platform.select(typography.body),
    fontWeight: '500',
    lineHeight: 20,
  },
  brandCard: {
    borderWidth: 1,
    borderRadius: 20,
    padding: 14,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    marginBottom: 16,
  },
  appIcon: {
    width: 58,
    height: 58,
    borderRadius: 14,
  },
  brandTextWrap: {
    flex: 1,
  },
  appName: {
    fontSize: 22,
    fontFamily: Platform.select(typography.display),
    fontWeight: '700',
    lineHeight: 28,
  },
  appTagline: {
    marginTop: 2,
    fontSize: 13,
    fontFamily: Platform.select(typography.body),
    fontWeight: '600',
    lineHeight: 18,
  },
  sectionBlock: {
    marginBottom: 14,
    paddingBottom: 10,
    borderBottomWidth: 1,
  },
  sectionTitle: {
    fontSize: 18,
    fontFamily: Platform.select(typography.heading),
    fontWeight: '700',
    marginBottom: 6,
  },
  paragraph: {
    fontSize: 16,
    fontFamily: Platform.select(typography.body),
    lineHeight: 27,
    marginBottom: 10,
    textAlign: 'left',
  },
  linkParagraph: {
    paddingVertical: 4,
  },
  linkText: {
    fontSize: 15,
    fontFamily: Platform.select(typography.heading),
    fontWeight: '700',
    textAlign: 'left',
  },
  devFooter: {
    marginTop: 10,
    paddingTop: 14,
    paddingBottom: 24,
    borderTopWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    gap: 8,
  },
  devText: {
    fontSize: 18,
    fontFamily: Platform.select(typography.heading),
    fontWeight: '700',
  },
});

export default AboutScreen;
