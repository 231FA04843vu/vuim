import {SubjectMarksInput} from '../types';

const clamp = (value: number, min: number, max: number) => {
  if (Number.isNaN(value)) {
    return 0;
  }
  return Math.min(Math.max(value, min), max);
};

export const sanitizeMarks = (input: SubjectMarksInput): SubjectMarksInput => ({
  pret1: clamp(input.pret1, 0, 10),
  t1: clamp(input.t1, 0, 20),
  t2: clamp(input.t2, 0, 5),
  t3: clamp(input.t3, 0, 5),
  t4: clamp(input.t4, 0, 20),
  cla1: clamp(input.cla1, 0, 20),
  cla2: clamp(input.cla2, 0, 20),
  cla3: clamp(input.cla3, 0, 20),
  cla4: clamp(input.cla4, 0, 20),
});

export const calculateInternalMarks = (rawInput: SubjectMarksInput) => {
  const marks = sanitizeMarks(rawInput);

  const pret1Scaled = (marks.pret1 / 10) * 6;
  const t1Scaled = (marks.t1 / 20) * 8;
  const t2Scaled = (marks.t2 / 5) * 3;
  const t3Scaled = (marks.t3 / 5) * 3;
  const claAverage = (marks.cla1 + marks.cla2 + marks.cla3 + marks.cla4) / 4;

  const total = pret1Scaled + t1Scaled + t2Scaled + t3Scaled + marks.t4 + claAverage;
  const roundedTotal = Number(total.toFixed(2));
  const percentage = Number(((roundedTotal / 60) * 100).toFixed(2));

  return {
    total: roundedTotal,
    percentage,
    marks,
  };
};
