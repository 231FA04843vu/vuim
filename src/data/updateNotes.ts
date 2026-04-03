import {UpdateNote} from '../types';

export const updateNotes: UpdateNote[] = [
  {
    version: '1.3.6',
    date: '2026-04-03',
    title: 'Realtime Release Notification Ready',
    highlights: [
      'FCM topic subscription flow added for release notifications',
      'Release workflow now sends FCM push on tagged releases',
      'Secure handling of Firebase config through GitHub secrets',
      'Update-note flow refined from version 1.3.5 to 1.3.6',
    ],
  },
  {
    version: '1.3.3',
    date: '2026-04-03',
    title: 'Automatic Update Alerts',
    highlights: [
      'One-time in-app update note appears automatically after upgrading',
      'Android system notification now prompts users about new updates',
      'Release workflow can notify a push backend automatically on each tag release',
      'Improved update flow reliability from version 1.3.2 to 1.3.3',
    ],
  },
  {
    version: '1.3.2',
    date: '2026-04-03',
    title: 'Smart Theme + Better AI Coach Flow',
    highlights: [
      'New theme settings in drawer: System, Light, and Dark modes',
      'AI chat now appears in natural conversation order (You then AI)',
      'Weekly plan and tasks now render as clear plan steps',
      'Updates page redesigned with release preview and highlights',
    ],
  },
  {
    version: '1.3.6',
    date: '2026-04-03',
    title: 'Stability Baseline for 1.3 Releases',
    highlights: [
      'Improved AI plan parsing reliability',
      'Polished data cards and navigation transitions',
      'Prepared internal config for incremental 1.3.x updates',
    ],
  },
  {
    version: '0.3.0',
    date: '2026-04-01',
    title: 'AI Academic Coach',
    highlights: [
      'Gemini-powered subject improvement suggestions',
      'AI-generated weekly study plan and timetable',
      'Chat with digital faculty mode for academic struggles',
    ],
  },
  {
    version: '0.2.0',
    date: '2026-03-30',
    title: 'Modern Navigation and UI Refresh',
    highlights: [
      'Bottom navigation model added',
      'Refined cards, input controls, and progress visuals',
      'Splash screen now uses app icon',
    ],
  },
];

export const FREE_UPDATE_OPTIONS = [
  {
    id: 'github-releases',
    label: 'Get Update From GitHub',
    url: 'https://github.com/your-username/vuim/releases/latest',
  },
  {
    id: 'direct-apk',
    label: 'Download Latest APK',
    url: 'https://example.com/vuim-latest.apk',
  },
];
