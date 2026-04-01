import {UpdateNote} from '../types';

export const updateNotes: UpdateNote[] = [
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
