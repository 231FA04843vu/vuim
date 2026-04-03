import React from 'react';
import {AppState, Linking, Platform, Pressable, ScrollView, StyleSheet, Text, View, Alert} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import {NativeStackScreenProps} from '@react-navigation/native-stack';
import {useSafeAreaInsets} from 'react-native-safe-area-context';
import LottieView from 'lottie-react-native';
import AnimatedGradientBackground from '../components/AnimatedGradientBackground';
import GlassCard from '../components/GlassCard';
import HamburgerButton from '../components/HamburgerButton';
import SideDrawerMenu from '../components/SideDrawerMenu';
import {APP_VERSION} from '../config/appMeta';
import {updateNotes} from '../data/updateNotes';
import {useNotifications} from '../context/NotificationsContext';
import {useSubjects} from '../context/SubjectsContext';
import {RootStackParamList} from '../navigation/types';
import {darkPalette, lightPalette, typography} from '../theme';
import {
  cleanupInAppDownloadedApk,
  getInAppDownloadProgress,
  installInAppDownloadedApk,
  startInAppApkDownload,
} from '../utils/inAppUpdate';
import {notify} from '../utils/notify';

type Props = NativeStackScreenProps<RootStackParamList, 'Updates'>;

const APK_CLEANUP_MARKER_KEY = '@vuim/pending_apk_cleanup';

type ReleaseState = {
  exists: boolean;
  available: boolean;
  latestVersion: string;
  downloadUrl: string;
  source: 'github' | 'none';
};

const normalizeVersion = (value: string) => value.trim().replace(/^v/i, '');

const compareVersions = (left: string, right: string): number => {
  const leftParts = normalizeVersion(left).split('.').map(part => Number.parseInt(part, 10) || 0);
  const rightParts = normalizeVersion(right).split('.').map(part => Number.parseInt(part, 10) || 0);
  const maxLength = Math.max(leftParts.length, rightParts.length);

  for (let index = 0; index < maxLength; index += 1) {
    const leftValue = leftParts[index] ?? 0;
    const rightValue = rightParts[index] ?? 0;
    if (leftValue > rightValue) {
      return 1;
    }
    if (leftValue < rightValue) {
      return -1;
    }
  }

  return 0;
};

const UpdatesScreen = ({navigation}: Props) => {
  const insets = useSafeAreaInsets();
  const {isDarkMode} = useSubjects();
  const {addNotification} = useNotifications();
  const palette = isDarkMode ? darkPalette : lightPalette;
  const [isChecking, setIsChecking] = React.useState(false);
  const [isDownloading, setIsDownloading] = React.useState(false);
  const [hasCheckedForUpdates, setHasCheckedForUpdates] = React.useState(false);
  const [isUpdateAvailable, setIsUpdateAvailable] = React.useState(false);
  const [downloadProgress, setDownloadProgress] = React.useState(0);
  const [downloadLabel, setDownloadLabel] = React.useState('Downloading...');
  const [menuVisible, setMenuVisible] = React.useState(false);
  const [releaseVersion] = React.useState(APP_VERSION);
  const [latestReleaseVersion, setLatestReleaseVersion] = React.useState(APP_VERSION);
  const [latestReleaseAt, setLatestReleaseAt] = React.useState('');
  const [latestDownloadUrl, setLatestDownloadUrl] = React.useState(
    'https://github.com/231FA04843vu/vuim/releases/latest/download/app-release.apk',
  );

  const pollTimerRef = React.useRef<ReturnType<typeof setInterval> | null>(null);
  const latestVsCurrent = compareVersions(latestReleaseVersion, APP_VERSION);
  const isCurrentBuildAhead = latestVsCurrent < 0;
  const latestNotes = React.useMemo(
    () => updateNotes.filter(note => note.version === latestReleaseVersion.replace(/^v/i, '')),
    [latestReleaseVersion],
  );

  const clearPoll = React.useCallback(() => {
    if (pollTimerRef.current) {
      clearInterval(pollTimerRef.current);
      pollTimerRef.current = null;
    }
  }, []);

  const runPendingCleanupIfUpdated = React.useCallback(async () => {
    try {
      const raw = await AsyncStorage.getItem(APK_CLEANUP_MARKER_KEY);
      if (!raw) {
        return;
      }

      const marker = JSON.parse(raw) as {downloadId?: string; targetVersion?: string};
      if (!marker.downloadId || !marker.targetVersion) {
        await AsyncStorage.removeItem(APK_CLEANUP_MARKER_KEY);
        return;
      }

      if (marker.targetVersion === APP_VERSION) {
        try {
          await cleanupInAppDownloadedApk(marker.downloadId);
        } catch {
          // Cleanup is best effort.
        }
        await AsyncStorage.removeItem(APK_CLEANUP_MARKER_KEY);
      }
    } catch {
      // Ignore cleanup parsing failures.
    }
  }, []);

  const refreshReleaseState = React.useCallback(async (): Promise<ReleaseState> => {
    try {
      const releaseResponse = await fetch('https://api.github.com/repos/231FA04843vu/vuim/releases/latest');

      let fetchedTag = APP_VERSION;
      let fetchedDownloadUrl = latestDownloadUrl;

      if (releaseResponse.ok) {
        const data = (await releaseResponse.json()) as {
          tag_name?: string;
          name?: string;
          published_at?: string;
          html_url?: string;
          assets?: Array<{name?: string; browser_download_url?: string}>;
        };
        const tag = (data.tag_name ?? data.name ?? '').trim();
        if (tag) {
          fetchedTag = tag.startsWith('v') ? tag : `v${tag}`;
          setLatestReleaseVersion(fetchedTag);
        }
        if (data.published_at) {
          setLatestReleaseAt(data.published_at);
        }
        const apkAsset = data.assets?.find(asset => asset.name === 'app-release.apk');
        if (apkAsset?.browser_download_url) {
          fetchedDownloadUrl = apkAsset.browser_download_url;
          setLatestDownloadUrl(apkAsset.browser_download_url);
        } else if (data.html_url) {
          fetchedDownloadUrl = `${data.html_url}/download/app-release.apk`;
          setLatestDownloadUrl(fetchedDownloadUrl);
        }
      }

      const available = compareVersions(fetchedTag, APP_VERSION) > 0;
      setIsUpdateAvailable(available);
      setHasCheckedForUpdates(true);
      return {
        exists: true,
        available,
        latestVersion: fetchedTag,
        downloadUrl: fetchedDownloadUrl,
        source: 'github',
      };
    } catch {
      setIsUpdateAvailable(false);
      return {
        exists: false,
        available: false,
        latestVersion: APP_VERSION,
        downloadUrl: latestDownloadUrl,
        source: 'none',
      };
    }
  }, [latestDownloadUrl]);

  React.useEffect(() => {
    runPendingCleanupIfUpdated();
    refreshReleaseState();

    const subscription = AppState.addEventListener('change', nextState => {
      if (nextState === 'active') {
        refreshReleaseState();
      }
    });

    const timer = setInterval(() => {
      void refreshReleaseState();
    }, 30000);

    return () => {
      subscription.remove();
      clearInterval(timer);
      clearPoll();
    };
  }, [clearPoll, refreshReleaseState, runPendingCleanupIfUpdated]);

  const checkForUpdates = async () => {
    if (isChecking || isDownloading) {
      return;
    }

    setIsChecking(true);
    const result = await refreshReleaseState();
    setIsChecking(false);

    if (!result.exists) {
      Alert.alert(
        'Update Service Unreachable',
        'Could not reach the update server. Check internet or try again in a minute.',
      );
      await addNotification({
        title: 'Update Check Failed',
        message: 'Could not reach update server. Please retry.',
        category: 'updates',
      });
      return;
    }

    if (!result.available) {
      const relation = compareVersions(result.latestVersion, APP_VERSION);
      const infoMessage =
        relation < 0
          ? `Installed version (${APP_VERSION}) is newer than GitHub latest (${normalizeVersion(result.latestVersion)}).`
          : 'You are already on the latest available version.';

      Alert.alert('No Updates Yet', infoMessage);
      await addNotification({
        title: 'No New Update',
        message: infoMessage,
        category: 'updates',
      });
      return;
    }

    await addNotification({
      title: 'Update Available',
      message: `A new app version (${result.latestVersion}) is available. Tap Update Now to download.`,
      category: 'updates',
    });
  };

  const downloadUpdate = async () => {
    if (!isUpdateAvailable) {
      return;
    }

    setIsDownloading(true);

    const result = await refreshReleaseState();
    if (!result.exists) {
      Alert.alert(
        'Update Service Unreachable',
        'The update server is currently unreachable. Please try again shortly.',
      );
      setIsDownloading(false);
      return;
    }

    if (!result.available) {
      notify('You are already on the latest available version');
      setIsDownloading(false);
      return;
    }

    if (Platform.OS === 'android') {
      try {
        clearPoll();
        setDownloadProgress(0);
        setDownloadLabel('Downloading update...');

        const downloadId = await startInAppApkDownload(result.downloadUrl);

        pollTimerRef.current = setInterval(async () => {
          try {
            const progress = await getInAppDownloadProgress(downloadId);
            const percent = Math.max(0, Math.min(100, progress.progress));
            setDownloadProgress(percent);

            if (progress.status === 'RUNNING' || progress.status === 'PENDING' || progress.status === 'PAUSED') {
              setDownloadLabel(`Downloading... ${percent}%`);
              return;
            }

            if (progress.status === 'FAILED') {
              clearPoll();
              setIsDownloading(false);
              notify('Update download failed');
              return;
            }

            if (progress.status === 'SUCCESSFUL') {
              clearPoll();
              setDownloadProgress(100);
              setDownloadLabel('Preparing installer...');

              const targetVersion = result.latestVersion.replace(/^v/i, '');
              await AsyncStorage.setItem(
                APK_CLEANUP_MARKER_KEY,
                JSON.stringify({downloadId, targetVersion}),
              );

              await installInAppDownloadedApk(downloadId);
              setIsDownloading(false);
            }
          } catch {
            clearPoll();
            setIsDownloading(false);
            notify('Unable to check update progress');
          }
        }, 800);

        return;
      } catch {
        setIsDownloading(false);
        notify('Could not start in-app update download');
        return;
      }
    }

    const canOpen = await Linking.canOpenURL(result.downloadUrl);
    if (!canOpen) {
      notify('Unable to download update');
      setIsDownloading(false);
      return;
    }

    try {
      await Linking.openURL(result.downloadUrl);
      await addNotification({
        title: 'Update Download Started',
        message: 'The latest APK is downloading. Complete installation to update the app.',
        category: 'updates',
      });
      setTimeout(() => {
        Alert.alert(
          'Update Downloaded!',
          'Installation will start shortly. Keep the app open until installation completes.',
        );
        setIsDownloading(false);
      }, 1000);
    } catch {
      notify('Failed to download update');
      setIsDownloading(false);
    }
  };

  return (
    <View style={styles.container}>
      <AnimatedGradientBackground palette={palette} />
      <ScrollView contentContainerStyle={[styles.content, {paddingTop: Math.max(18, insets.top + 8)}]}>
        <View style={styles.topRow}>
          <HamburgerButton palette={palette} isDarkMode={isDarkMode} onPress={() => setMenuVisible(true)} />
          <View>
            <Text style={[styles.overline, {color: palette.textSecondary}]}>Updates</Text>
            <Text style={[styles.title, {color: palette.textPrimary}]}>Updates</Text>
            <Text style={[styles.subtitle, {color: palette.textMuted}]}>Tap once to check for new versions</Text>
            <View style={[styles.versionPill, {backgroundColor: palette.accentSoft}]}>
              <Text style={[styles.versionLabel, {color: palette.textSecondary}]}>Current version</Text>
              <Text style={[styles.versionValue, {color: palette.textPrimary}]}>{releaseVersion}</Text>
            </View>
            {!!latestReleaseAt && (
              <Text style={[styles.subtitle, {color: palette.textMuted}]}>Latest GitHub release synced live.</Text>
            )}
          </View>
        </View>

        {(isChecking || isDownloading) && (
          <View style={styles.animationContainer}>
            <View style={[styles.animationFrame, {backgroundColor: palette.surface, borderColor: palette.cardBorder}]}> 
            <LottieView
              source={require('../../assets/gears-animation.json')}
              autoPlay
              loop
              resizeMode="contain"
              renderMode="HARDWARE"
              style={styles.gearAnimation}
            />
            </View>
            <Text style={[styles.downloadingText, {color: palette.textPrimary}]}>
              {isChecking ? 'Checking for updates...' : downloadLabel}
            </Text>
            {isDownloading && (
              <Text style={[styles.progressText, {color: palette.textSecondary}]}>{downloadProgress}%</Text>
            )}
          </View>
        )}

        <Pressable
          style={[
            styles.downloadButton,
            {backgroundColor: palette.accent, opacity: isChecking || isDownloading ? 0.6 : 1},
          ]}
          onPress={hasCheckedForUpdates && isUpdateAvailable ? downloadUpdate : checkForUpdates}
          disabled={isChecking || isDownloading}>
          <Text style={styles.downloadButtonText}>
            {isChecking
              ? 'Checking...'
              : isDownloading
              ? 'Downloading...'
              : hasCheckedForUpdates && isUpdateAvailable
              ? 'Update Now'
              : hasCheckedForUpdates
              ? `Already on Latest (v${normalizeVersion(APP_VERSION)})`
              : 'Check for Updates'}
          </Text>
        </Pressable>

        {hasCheckedForUpdates && isCurrentBuildAhead && (
          <Text style={[styles.statusHint, {color: palette.textSecondary}]}>GitHub latest is v{normalizeVersion(latestReleaseVersion)}. This app build is newer.</Text>
        )}

        {hasCheckedForUpdates && isUpdateAvailable && latestNotes.length > 0 && (
          <Text style={[styles.featureTitle, {color: palette.textPrimary}]}>What's New</Text>
        )}

        {hasCheckedForUpdates &&
          isUpdateAvailable &&
          latestNotes.map(note => (
          <GlassCard key={note.version} palette={palette} style={styles.card}>
            <Text style={[styles.version, {color: palette.accent}]}>v{note.version}</Text>
            <Text style={[styles.cardTitle, {color: palette.textPrimary}]}>{note.title}</Text>
            <Text style={[styles.date, {color: palette.textSecondary}]}>{note.date}</Text>
            {note.highlights.map(highlight => (
              <Text key={highlight} style={[styles.highlight, {color: palette.textPrimary}]}> 
                • {highlight}
              </Text>
            ))}
          </GlassCard>
        ))}

        {hasCheckedForUpdates && isUpdateAvailable && latestNotes.length === 0 && (
          <GlassCard palette={palette} style={styles.card}>
            <Text style={[styles.version, {color: palette.accent}]}>{latestReleaseVersion}</Text>
            <Text style={[styles.cardTitle, {color: palette.textPrimary}]}>What&apos;s New</Text>
            <Text style={[styles.highlight, {color: palette.textPrimary}]}>Release notes for this version are not yet available in-app.</Text>
            <Text style={[styles.highlight, {color: palette.textPrimary}]}>You can still continue installing this update.</Text>
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
    marginBottom: 4,
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
    fontFamily: Platform.select(typography.display),
    fontWeight: '700',
    lineHeight: 36,
  },
  subtitle: {
    marginTop: 4,
    marginBottom: 16,
    fontSize: 14,
    fontFamily: Platform.select(typography.body),
    lineHeight: 20,
  },
  versionPill: {
    alignSelf: 'flex-start',
    borderRadius: 14,
    paddingHorizontal: 12,
    paddingVertical: 10,
    marginBottom: 16,
  },
  versionLabel: {
    fontSize: 10,
    fontFamily: Platform.select(typography.heading),
    fontWeight: '700',
    letterSpacing: 0.8,
    textTransform: 'uppercase',
    marginBottom: 4,
  },
  versionValue: {
    fontSize: 15,
    fontFamily: Platform.select(typography.heading),
    fontWeight: '700',
  },
  animationContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 20,
    paddingVertical: 12,
  },
  animationFrame: {
    width: 210,
    height: 210,
    borderRadius: 105,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  gearAnimation: {
    width: 180,
    height: 180,
  },
  downloadingText: {
    fontSize: 14,
    fontFamily: Platform.select(typography.heading),
    fontWeight: '600',
    letterSpacing: 0.5,
    marginTop: 12,
  },
  progressText: {
    marginTop: 6,
    fontSize: 12,
    fontFamily: Platform.select(typography.body),
    fontWeight: '600',
  },
  downloadButton: {
    borderRadius: 12,
    paddingVertical: 16,
    paddingHorizontal: 20,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 20,
  },
  downloadButtonText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontFamily: Platform.select(typography.heading),
    fontWeight: '700',
    letterSpacing: 0.6,
  },
  statusHint: {
    marginTop: -8,
    marginBottom: 14,
    fontSize: 12,
    fontFamily: Platform.select(typography.body),
    lineHeight: 18,
  },
  featureTitle: {
    fontSize: 16,
    fontFamily: Platform.select(typography.heading),
    fontWeight: '700',
    marginTop: 8,
    marginBottom: 12,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    lineHeight: 20,
  },
  card: {
    marginBottom: 10,
  },
  version: {
    fontSize: 12,
    fontFamily: Platform.select(typography.heading),
    fontWeight: '700',
    marginBottom: 4,
  },
  cardTitle: {
    fontSize: 16,
    fontFamily: Platform.select(typography.heading),
    fontWeight: '700',
    marginBottom: 2,
  },
  date: {
    fontSize: 12,
    fontFamily: Platform.select(typography.body),
    marginBottom: 8,
  },
  highlight: {
    fontSize: 14,
    fontFamily: Platform.select(typography.body),
    marginBottom: 4,
    lineHeight: 20,
  },
});

export default UpdatesScreen;
