import {CachedLatestRelease, loadCachedLatestRelease, saveCachedLatestRelease} from '../storage/updateStorage';

const LATEST_RELEASE_URL = 'https://api.github.com/repos/231FA04843vu/vuim/releases/latest';
const FALLBACK_DOWNLOAD_URL = 'https://github.com/231FA04843vu/vuim/releases/latest/download/app-release.apk';

const normalizeTag = (raw: string) => {
  const value = raw.trim();
  if (!value) {
    return '';
  }
  return value.startsWith('v') ? value : `v${value}`;
};

export const parseReleaseHighlights = (body?: string) => {
  if (!body) {
    return [] as string[];
  }

  const bulletLines = body
    .split('\n')
    .map(line => line.trim())
    .filter(line => line.startsWith('- ') || line.startsWith('* '))
    .map(line => line.replace(/^[-*]\s+/, '').trim())
    .filter(Boolean);

  if (bulletLines.length > 0) {
    return bulletLines.slice(0, 8);
  }

  return body
    .split('\n')
    .map(line => line.trim())
    .filter(Boolean)
    .filter(line => !line.startsWith('#'))
    .slice(0, 6);
};

export const fetchAndCacheLatestRelease = async () => {
  const response = await fetch(LATEST_RELEASE_URL);
  if (!response.ok) {
    throw new Error(`GitHub release request failed with ${response.status}`);
  }

  const data = (await response.json()) as {
    tag_name?: string;
    name?: string;
    body?: string;
    published_at?: string;
    html_url?: string;
    assets?: Array<{name?: string; browser_download_url?: string}>;
  };

  const tag = normalizeTag((data.tag_name ?? data.name ?? '').trim());
  if (!tag) {
    throw new Error('GitHub latest release has no tag');
  }

  const apkAsset = data.assets?.find(asset => asset.name === 'app-release.apk');
  const downloadUrl = apkAsset?.browser_download_url ?? (data.html_url ? `${data.html_url}/download/app-release.apk` : FALLBACK_DOWNLOAD_URL);

  const release: CachedLatestRelease = {
    tag,
    name: (data.name ?? '').trim(),
    publishedAt: data.published_at ?? '',
    body: data.body ?? '',
    downloadUrl,
    cachedAt: new Date().toISOString(),
  };

  await saveCachedLatestRelease(release);
  return release;
};

export const getLatestReleaseInfo = async () => {
  try {
    return await fetchAndCacheLatestRelease();
  } catch {
    return await loadCachedLatestRelease();
  }
};
