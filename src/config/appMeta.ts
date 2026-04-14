const packageMeta = require('../../package.json') as {version?: string};
const appMeta = require('../../app.json') as {expo?: {version?: string}};

const normalizeVersion = (value: string) => value.trim().replace(/^v/i, '');

const installedVersion = appMeta.expo?.version ?? packageMeta.version ?? '1.0.0';

export const APP_VERSION = normalizeVersion(installedVersion);
