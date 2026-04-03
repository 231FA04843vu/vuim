export type ModuleType = 'Module 1' | 'Module 2';

export type SubjectMarksInput = {
  pret1: number;
  t1: number;
  t2: number;
  t3: number;
  t4: number;
  cla1: number;
  cla2: number;
  cla3: number;
  cla4: number;
};

export type SubjectRecord = {
  id: string;
  subjectName: string;
  module: ModuleType;
  marks: SubjectMarksInput;
  total: number;
  percentage: number;
  updatedAt: string;
};

export type ThemeMode = 'system' | 'light' | 'dark';

export type AppPreferences = {
  themeMode: ThemeMode;
};

export type AIMessage = {
  id: string;
  role: 'user' | 'assistant';
  text: string;
  createdAt: string;
};

export type UpdateNote = {
  version: string;
  date: string;
  title: string;
  highlights: string[];
};

export type CoachSubjectInsight = {
  subject: string;
  currentPercent: number;
  weakAreas: string;
  targetPercent: number;
};

export type CoachTimeBlock = {
  day: string;
  start: string;
  end: string;
  task: string;
};

export type CoachPlanResponse = {
  summary: string;
  subjectInsights: CoachSubjectInsight[];
  priorityActions: string[];
  weeklyPlan: string[];
  timetable: CoachTimeBlock[];
  motivation: string;
};
