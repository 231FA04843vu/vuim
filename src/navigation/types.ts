export type RootStackParamList = {
  Splash: undefined;
  Home: undefined;
  SubjectForm: {recordId?: string} | undefined;
  SavedRecords: undefined;
  SubjectPerformance: {subjectName: string};
  AICoach: {focusSubject?: string} | undefined;
  Notifications: undefined;
  Updates: undefined;
  MyTasks: undefined;
  AboutApp: undefined;
  AboutDetail: {
    title: string;
    content: string;
  };
};
