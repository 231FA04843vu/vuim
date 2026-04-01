import React, {createContext, useCallback, useContext, useEffect, useMemo, useState} from 'react';
import {loadPrefs, loadRecords, savePrefs, saveRecords} from '../storage/subjectsStorage';
import {ModuleType, SubjectMarksInput, SubjectRecord} from '../types';
import {calculateInternalMarks} from '../utils/calculate';

type SubjectPayload = {
  subjectName: string;
  module: ModuleType;
  marks: SubjectMarksInput;
};

type SubjectsContextType = {
  loading: boolean;
  records: SubjectRecord[];
  isDarkMode: boolean;
  addRecord: (payload: SubjectPayload) => Promise<SubjectRecord>;
  updateRecord: (id: string, payload: SubjectPayload) => Promise<SubjectRecord | null>;
  deleteRecord: (id: string) => Promise<void>;
  resetRecords: () => Promise<void>;
  toggleTheme: () => Promise<void>;
  findRecordById: (id: string) => SubjectRecord | undefined;
};

const SubjectsContext = createContext<SubjectsContextType | undefined>(undefined);

const newId = () => `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;

export const SubjectsProvider = ({children}: {children: React.ReactNode}) => {
  const [loading, setLoading] = useState(true);
  const [records, setRecords] = useState<SubjectRecord[]>([]);
  const [isDarkMode, setIsDarkMode] = useState(false);

  useEffect(() => {
    const bootstrap = async () => {
      const [loadedRecords, loadedPrefs] = await Promise.all([loadRecords(), loadPrefs()]);
      setRecords(loadedRecords);
      setIsDarkMode(loadedPrefs.isDarkMode);
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

  const toggleTheme = useCallback(async () => {
    const next = !isDarkMode;
    setIsDarkMode(next);
    await savePrefs({isDarkMode: next});
  }, [isDarkMode]);

  const findRecordById = useCallback(
    (id: string) => records.find(r => r.id === id),
    [records],
  );

  const value = useMemo(
    () => ({
      loading,
      records,
      isDarkMode,
      addRecord,
      updateRecord,
      deleteRecord,
      resetRecords,
      toggleTheme,
      findRecordById,
    }),
    [
      loading,
      records,
      isDarkMode,
      addRecord,
      updateRecord,
      deleteRecord,
      resetRecords,
      toggleTheme,
      findRecordById,
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
