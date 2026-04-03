import {NativeModules, Platform} from 'react-native';

type DownloadStatus = 'PENDING' | 'RUNNING' | 'PAUSED' | 'SUCCESSFUL' | 'FAILED' | 'UNKNOWN';

type DownloadProgress = {
  status: DownloadStatus;
  bytesDownloaded: number;
  totalBytes: number;
  progress: number;
  localUri: string;
};

type InAppUpdateNative = {
  startApkDownload: (url: string) => Promise<string>;
  getDownloadProgress: (downloadId: string) => Promise<DownloadProgress>;
  installDownloadedApk: (downloadId: string) => Promise<boolean>;
  cleanupDownloadedApk: (downloadId: string) => Promise<boolean>;
};

const nativeModule = (NativeModules.InAppUpdate as InAppUpdateNative | undefined) ?? undefined;

const assertAndroidModule = () => {
  if (Platform.OS !== 'android' || !nativeModule) {
    throw new Error('In-app APK update is available only on Android native builds.');
  }
  return nativeModule;
};

export const startInAppApkDownload = async (url: string) => {
  const module = assertAndroidModule();
  return module.startApkDownload(url);
};

export const getInAppDownloadProgress = async (downloadId: string) => {
  const module = assertAndroidModule();
  return module.getDownloadProgress(downloadId);
};

export const installInAppDownloadedApk = async (downloadId: string) => {
  const module = assertAndroidModule();
  return module.installDownloadedApk(downloadId);
};

export const cleanupInAppDownloadedApk = async (downloadId: string) => {
  const module = assertAndroidModule();
  return module.cleanupDownloadedApk(downloadId);
};
