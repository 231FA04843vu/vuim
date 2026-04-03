import {UpdateNote} from '../types';

export const updateNotes: UpdateNote[] = [
  {
    version: '1.4.1',
    date: '2026-04-03',
    title: 'Subject-Scoped AI, LiveTalk Stability, and Better Attachments',
    highlights: [
      'AI Coach data is now separated per subject (chat, tasks, plans, timetable, and study materials)',
      'My Tasks now respects subject context when opened from AI Coach',
      'LiveTalk mic toggle behavior fixed for reliable on/off state',
      'LiveTalk includes manual listening restart control for recovery when capture stalls',
      'File attachments are now integrated into composer message flow before send',
      'Expanded attachment handling for image, pdf, doc/docx/rtf, and txt/json/md/csv formats',
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
