import {CoachPlanResponse, SubjectRecord} from '../types';

const API_VERSIONS = ['v1beta', 'v1'];
const FALLBACK_MODELS = ['gemini-2.0-flash', 'gemini-2.0-flash-lite', 'gemini-1.5-flash'];

type GeminiModel = {
  name?: string;
  supportedGenerationMethods?: string[];
};

const normalizeModelName = (name: string) => name.replace(/^models\//, '');

const discoverModels = async (apiKey: string, apiVersion: string): Promise<string[]> => {
  const listUrl = `https://generativelanguage.googleapis.com/${apiVersion}/models?key=${encodeURIComponent(apiKey)}`;
  const response = await fetch(listUrl);
  if (!response.ok) {
    return [];
  }

  const data = (await response.json()) as {models?: GeminiModel[]};
  const modelNames =
    data.models
      ?.filter(model => model.supportedGenerationMethods?.includes('generateContent'))
      .map(model => (model.name ? normalizeModelName(model.name) : ''))
      .filter(Boolean) ?? [];

  return modelNames;
};

type GeminiPayload = {
  apiKey: string;
  prompt: string;
};

const summarizeRecords = (records: SubjectRecord[]) => {
  if (records.length === 0) {
    return 'No subject records available yet.';
  }

  return records
    .map(
      r =>
        `Subject: ${r.subjectName}, Module: ${r.module}, Total: ${r.total.toFixed(2)}/60, Percentage: ${r.percentage.toFixed(2)}%`,
    )
    .join('\n');
};

export const buildCoachPrompt = (records: SubjectRecord[], userInput: string) => {
  return [
    'You are a strict but supportive digital faculty mentor for engineering students.',
    'Use the data below to give practical and personalized advice.',
    'Return ONLY valid JSON. No markdown. No code fences.',
    'Use this exact JSON shape:',
    '{',
    '  "summary": "string",',
    '  "subjectInsights": [',
    '    {"subject":"string","currentPercent":number,"weakAreas":"string","targetPercent":number}',
    '  ],',
    '  "priorityActions": ["string"],',
    '  "weeklyPlan": ["string"],',
    '  "timetable": [',
    '    {"day":"Mon","start":"06:00","end":"07:00","task":"Revision"}',
    '  ],',
    '  "motivation": "string"',
    '}',
    'Keep weeklyPlan concise (max 7 items).',
    'Keep timetable realistic and focused on academic tasks.',
    '',
    'Student records:',
    summarizeRecords(records),
    '',
    `Student context: ${userInput || 'No extra context provided.'}`,
  ].join('\n');
};

export const buildChatPrompt = (records: SubjectRecord[], userMessage: string) => {
  return [
    'You are a digital faculty mentor.',
    'Give focused, clear, non-generic academic guidance.',
    'If student shares struggles, respond with empathy and concrete steps.',
    '',
    'Student records:',
    summarizeRecords(records),
    '',
    `Student message: ${userMessage}`,
  ].join('\n');
};

export const requestGeminiText = async ({apiKey, prompt}: GeminiPayload): Promise<string> => {
  let lastError = 'Unknown Gemini error';

  for (const apiVersion of API_VERSIONS) {
    const discoveredModels = await discoverModels(apiKey, apiVersion);
    const modelsToTry = Array.from(new Set([...discoveredModels, ...FALLBACK_MODELS]));

    for (const model of modelsToTry) {
      const endpoint = `https://generativelanguage.googleapis.com/${apiVersion}/models/${model}:generateContent?key=${encodeURIComponent(apiKey)}`;
      const response = await fetch(endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          contents: [
            {
              role: 'user',
              parts: [{text: prompt}],
            },
          ],
          generationConfig: {
            temperature: 0.6,
            topP: 0.9,
            topK: 32,
            maxOutputTokens: 1024,
          },
        }),
      });

      if (!response.ok) {
        const errorText = await response.text();
        lastError = `Gemini request failed (${response.status}) on ${model} (${apiVersion}): ${errorText}`;
        if (response.status === 404) {
          continue;
        }
        throw new Error(lastError);
      }

      const data = (await response.json()) as {
        candidates?: Array<{
          content?: {
            parts?: Array<{text?: string}>;
          };
        }>;
      };

      const text = data.candidates?.[0]?.content?.parts?.map(part => part.text ?? '').join('').trim();

      if (text) {
        return text;
      }

      lastError = `Gemini returned an empty response on ${model} (${apiVersion}).`;
    }
  }

  throw new Error(lastError);
};

const parseJsonBlock = (input: string) => {
  const cleaned = input.trim().replace(/^```json\s*/i, '').replace(/^```/, '').replace(/```$/, '').trim();
  return JSON.parse(cleaned) as CoachPlanResponse;
};

export const parseCoachPlanResponse = (rawText: string): CoachPlanResponse => {
  const parsed = parseJsonBlock(rawText);

  return {
    summary: parsed.summary ?? 'No summary available.',
    subjectInsights: Array.isArray(parsed.subjectInsights) ? parsed.subjectInsights : [],
    priorityActions: Array.isArray(parsed.priorityActions) ? parsed.priorityActions : [],
    weeklyPlan: Array.isArray(parsed.weeklyPlan) ? parsed.weeklyPlan : [],
    timetable: Array.isArray(parsed.timetable) ? parsed.timetable : [],
    motivation: parsed.motivation ?? 'Keep showing up daily and improve consistently.',
  };
};
