import React, {createContext, useCallback, useContext, useEffect, useMemo, useState} from 'react';
import {useColorScheme} from 'react-native';
import {loadPrefs, loadRecords, savePrefs, saveRecords} from '../storage/subjectsStorage';
import {ModuleType, SubjectMarksInput, SubjectRecord, ThemeMode} from '../types';
import {calculateInternalMarks} from '../utils/calculate';

type SubjectPayload = {
  subjectName: string;
  module: ModuleType;
  marks: SubjectMarksInput;
};

type SubjectsContextType = {
  loading: boolean;
  records: SubjectRecord[];
  themeMode: ThemeMode;
  isDarkMode: boolean;
  addRecord: (payload: SubjectPayload) => Promise<SubjectRecord>;
  updateRecord: (id: string, payload: SubjectPayload) => Promise<SubjectRecord | null>;
  deleteRecord: (id: string) => Promise<void>;
  resetRecords: () => Promise<void>;
  setThemeMode: (mode: ThemeMode) => Promise<void>;
  toggleTheme: () => Promise<void>;
  findRecordById: (id: string) => SubjectRecord | undefined;
  clearCache: () => Promise<void>;
  clearData: () => Promise<void>;
};

const SubjectsContext = createContext<SubjectsContextType | undefined>(undefined);

const newId = () => `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;

export const SubjectsProvider = ({children}: {children: React.ReactNode}) => {
  const systemScheme = useColorScheme();
  const [loading, setLoading] = useState(true);
  const [records, setRecords] = useState<SubjectRecord[]>([]);
  const [themeMode, setThemeModeState] = useState<ThemeMode>('system');

  useEffect(() => {
    const bootstrap = async () => {
      const [loadedRecords, loadedPrefs] = await Promise.all([loadRecords(), loadPrefs()]);
      setRecords(loadedRecords);
      setThemeModeState(loadedPrefs.themeMode);
      setLoading(false);
    };

    bootstrap();
  }, []);

  const persistRecords = useCallback(async (nextRecords: SubjectRecord[]) => {
    setRecords(nextRecords);
    await saveRecords(nextRecords);
  }, []);

  const addRecord = useCallback(
    async (payload: SubjectPayload) => {
      const calculated = calculateInternalMarks(payload.marks);
      const record: SubjectRecord = {
        id: newId(),
        subjectName: payload.subjectName.trim(),
        module: payload.module,
        marks: calculated.marks,
        total: calculated.total,
        percentage: calculated.percentage,
        updatedAt: new Date().toISOString(),
      };
      const next = [record, ...records];
      await persistRecords(next);
      return record;
    },
    [persistRecords, records],
  );

  const updateRecord = useCallback(
    async (id: string, payload: SubjectPayload) => {
      const existing = records.find(r => r.id === id);
      if (!existing) {
        return null;
      }

      const calculated = calculateInternalMarks(payload.marks);
      const updated: SubjectRecord = {
        ...existing,
        subjectName: payload.subjectName.trim(),
        module: payload.module,
        marks: calculated.marks,
        total: calculated.total,
        percentage: calculated.percentage,
        updatedAt: new Date().toISOString(),
      };

      const next = records.map(item => (item.id === id ? updated : item));
      await persistRecords(next);
      return updated;
    },
    [persistRecords, records],
  );

  const deleteRecord = useCallback(
    async (id: string) => {
      const next = records.filter(item => item.id !== id);
      await persistRecords(next);
    },
    [persistRecords, records],
  );

  const resetRecords = useCallback(async () => {
    await persistRecords([]);
  }, [persistRecords]);

  const setThemeMode = useCallback(async (mode: ThemeMode) => {
    setThemeModeState(mode);
    await savePrefs({themeMode: mode});
  }, []);

  const resolvedTheme =
    themeMode === 'system' ? (systemScheme === 'dark' ? 'dark' : 'light') : themeMode;
  const isDarkMode = resolvedTheme === 'dark';

  const toggleTheme = useCallback(async () => {
    const nextMode: ThemeMode = isDarkMode ? 'light' : 'dark';
    await setThemeMode(nextMode);
  }, [isDarkMode, setThemeMode]);

  const findRecordById = useCallback(
    (id: string) => records.find(r => r.id === id),
    [records],
  );

  const clearCache = useCallback(async () => {
    await resetRecords();
  }, [resetRecords]);

  const clearData = useCallback(async () => {
    await resetRecords();
  }, [resetRecords]);

  const value = useMemo(
    () => ({
      loading,
      records,
      themeMode,
      isDarkMode,
      addRecord,
      updateRecord,
      deleteRecord,
      resetRecords,
      setThemeMode,
      toggleTheme,
      findRecordById,
      clearCache,
      clearData,
    }),
    [
      loading,
      records,
      themeMode,
      isDarkMode,
      addRecord,
      updateRecord,
      deleteRecord,
      resetRecords,
      setThemeMode,
      toggleTheme,
      findRecordById,
      clearCache,
      clearData,
    ],
  );

  return <SubjectsContext.Provider value={value}>{children}</SubjectsContext.Provider>;
};

export const useSubjects = () => {
  const ctx = useContext(SubjectsContext);
  if (!ctx) {
    throw new Error('useSubjects must be used within SubjectsProvider');
  }
  return ctx;
};
