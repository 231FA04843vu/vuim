import {AIMessage, CoachPlanResponse, SubjectRecord} from '../types';
import {
  DEFAULT_OPENROUTER_MODEL,
  OPENROUTER_API_URL,
  OPENROUTER_FALLBACK_MODELS,
} from '../config/ai';

type OpenRouterPayload = {
  apiKey: string;
  prompt: string;
  model?: string;
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

export const buildMentorPrompt = (records: SubjectRecord[], userMessage: string, history: AIMessage[] = []) => {
  const historyLines = history
    .slice(0, 16)
    .reverse()
    .map(message => `${message.role === 'assistant' ? 'AI Mentor' : 'Student'}: ${message.text}`)
    .join('\n');

  return [
    'You are a digital faculty mentor for a university student.',
    'Respond in clear practical language as a supportive mentor.',
    'Do not output markdown code fences.',
    'If the user asks for a plan, include 5 to 8 actionable daily tasks.',
    'Task lines must be concrete actions (start with verbs like Revise, Solve, Practice, Read, Write, Attempt, Review).',
    'Avoid motivational filler in task list (for example: Thanks for reaching out, It is normal to struggle, You got this).',
    'When giving a plan, add this exact heading and numbered list format:',
    'PLAN_TASKS:',
    '1. Revise <topic> for 30 minutes',
    '2. Solve 10 problems from <topic>',
    '...',
    'If the user asks for timetable/schedule/study timing, include a weekly timetable with 5 to 7 entries spread across at least 3 different days.',
    'Include this optional block at the end exactly when timetable is needed:',
    'TIMETABLE_JSON_START',
    '{"timetable":[{"day":"Mon","start":"06:30","end":"07:30","task":"Revision"},{"day":"Tue","start":"06:30","end":"07:30","task":"Practice"},{"day":"Wed","start":"06:30","end":"07:30","task":"Review"}]}',
    'TIMETABLE_JSON_END',
    'Only include the block when timetable is actually needed.',
    'Outside the optional timetable block, write normal conversational text.',
    '',
    'Student records:',
    summarizeRecords(records),
    '',
    historyLines ? 'Conversation history:\n' + historyLines : 'Conversation history: (new session)',
    '',
    `Student message: ${userMessage}`,
  ].join('\n');
};

const extractOpenRouterText = (
  content: string | Array<{type?: string; text?: string}> | undefined,
): string => {
  if (!content) {
    return '';
  }
  if (typeof content === 'string') {
    return content.trim();
  }
  return content
    .map(part => (typeof part.text === 'string' ? part.text : ''))
    .join('')
    .trim();
};

export const requestOpenRouterText = async ({apiKey, prompt, model}: OpenRouterPayload): Promise<string> => {
  let lastError = 'Unknown OpenRouter error';
  const modelsToTry = Array.from(new Set([model ?? DEFAULT_OPENROUTER_MODEL, ...OPENROUTER_FALLBACK_MODELS]));

  type OpenRouterResponse = {
    choices?: Array<{message?: {content?: string | Array<{type?: string; text?: string}>}}>;
    error?: {message?: string};
  };

  for (const currentModel of modelsToTry) {
    const response = await fetch(OPENROUTER_API_URL, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
        'HTTP-Referer': 'https://github.com/231FA04843vu/vuim',
        'X-Title': 'VUIM AI Coach',
      },
      body: JSON.stringify({
        model: currentModel,
        messages: [
          {
            role: 'user',
            content: prompt,
          },
        ],
        temperature: 0.6,
        max_tokens: 1024,
      }),
    });

    const rawText = await response.text();
    let data: OpenRouterResponse = {};

    try {
      data = JSON.parse(rawText) as OpenRouterResponse;
    } catch {
      data = {};
    }

    if (!response.ok) {
      lastError =
        data?.error?.message ?? `OpenRouter request failed (${response.status}) on ${currentModel}: ${rawText}`;

      // Try a different model for provider/model-not-found/temporary failures.
      if (response.status === 404 || response.status === 429 || response.status >= 500) {
        continue;
      }
      throw new Error(lastError);
    }

    const text = extractOpenRouterText(data?.choices?.[0]?.message?.content);
    if (text) {
      return text;
    }

    lastError = `OpenRouter returned an empty response on ${currentModel}.`;
  }

  throw new Error(lastError);
};

// Backward-compatible alias while the file name remains gemini.ts.
export const requestGeminiText = requestOpenRouterText;

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

const sanitizeTime = (value: unknown): string | null => {
  if (typeof value !== 'string') {
    return null;
  }
  const trimmed = value.trim();
  return /^\d{1,2}:\d{2}$/.test(trimmed) ? trimmed : null;
};

const sanitizeDay = (value: unknown): string | null => {
  if (typeof value !== 'string') {
    return null;
  }
  const cleaned = value.trim().slice(0, 3).toLowerCase();
  const map: Record<string, string> = {
    mon: 'Mon',
    tue: 'Tue',
    wed: 'Wed',
    thu: 'Thu',
    fri: 'Fri',
    sat: 'Sat',
    sun: 'Sun',
  };
  return map[cleaned] ?? null;
};

export const extractTimetableFromMentorResponse = (
  rawText: string,
): {cleanText: string; timetable: CoachPlanResponse['timetable']} => {
  const markerRegex = /TIMETABLE_JSON_START([\s\S]*?)TIMETABLE_JSON_END/i;
  const match = rawText.match(markerRegex);
  if (!match) {
    return {cleanText: rawText.trim(), timetable: []};
  }

  const jsonText = match[1].trim();
  const cleanText = rawText.replace(markerRegex, '').trim();

  try {
    const parsed = JSON.parse(jsonText) as {timetable?: Array<Record<string, unknown>>};
    const rows = Array.isArray(parsed.timetable) ? parsed.timetable : [];
    const timetable = rows
      .map(row => {
        const day = sanitizeDay(row.day);
        const start = sanitizeTime(row.start);
        const end = sanitizeTime(row.end);
        const task = typeof row.task === 'string' ? row.task.trim() : '';
        if (!day || !start || !end || !task) {
          return null;
        }
        return {day, start, end, task};
      })
      .filter((item): item is CoachPlanResponse['timetable'][number] => item !== null);

    return {cleanText, timetable};
  } catch {
    return {cleanText, timetable: []};
  }
};

export const extractPlanTasksFromText = (text: string, limit = 6): string[] => {
  const stripped = text.replace(/TIMETABLE_JSON_START[\s\S]*?TIMETABLE_JSON_END/gi, '');

  const stopPhrases = [
    /^thanks\b/i,
    /^i see your score\b/i,
    /^it'?s completely normal\b/i,
    /^let'?s get a clear plan\b/i,
    /^this isn'?t just about\b/i,
    /^remember\b/i,
    /^you got this\b/i,
  ];

  const hasStopPhrase = (line: string) => stopPhrases.some(pattern => pattern.test(line));

  const cleanedLines = text
    .split('\n')
    .map(line => line.trim())
    .filter(Boolean);

  const structuredTasks = cleanedLines
    .filter(line => /^\d+[.)]\s+/.test(line) || /^[-*\u2022]\s+/.test(line))
    .map(line => line.replace(/^[-*\u2022]\s*/, '').replace(/^\d+[.)]\s*/, '').replace(/\*\*/g, '').trim())
    .filter(line => line.length >= 8 && line.length <= 160)
    .filter(line => !hasStopPhrase(line))
    .filter(line => /\b(revise|practice|solve|review|focus|study|complete|prepare|improve|schedule|read|work|break|identify|talk|revisit|recap|write|attempt|build)\b/i.test(line));

  if (structuredTasks.length > 0) {
    return Array.from(new Set(structuredTasks.map(line => line.replace(/\s+/g, ' ').trim()))).slice(0, limit);
  }

  const candidateLines = stripped
    .split('\n')
    .map(line => line.trim())
    .filter(Boolean)
    .map(line => line.replace(/^[-*\u2022]\s*/, '').replace(/^\d+[.)]\s*/, '').trim())
    .filter(line => line.length >= 8 && line.length <= 160)
    .filter(line => !/^section\b/i.test(line))
    .filter(line => !/^summary:?$/i.test(line))
    .filter(line => !/^motivation:?$/i.test(line))
    .filter(line => !/^weekly plan:?$/i.test(line))
    .filter(line => !/^timetable:?$/i.test(line))
    .filter(line => !hasStopPhrase(line));

  const unique: string[] = [];
  for (const line of candidateLines) {
    const segments = line
      .split(/(?<=[.!?])\s+/)
      .map(segment => segment.trim())
      .filter(Boolean);

    for (const segment of segments.length > 0 ? segments : [line]) {
      const task = segment
        .replace(/\*\*/g, '')
        .replace(/^[-*\u2022]\s*/, '')
        .replace(/^\d+[.)]\s*/, '')
        .trim();

      if (task.length < 8 || task.length > 160) {
        continue;
      }

      if (
        !/\b(revise|practice|solve|review|focus|study|complete|prepare|improve|schedule|read|work|break|identify|talk|revisit|recap|write|attempt|build)\b/i.test(
          task,
        )
      ) {
        continue;
      }

      if (!unique.some(item => item.toLowerCase() === task.toLowerCase())) {
        unique.push(task);
      }
      if (unique.length >= limit) {
        break;
      }
    }
    if (unique.length >= limit) {
      break;
    }
  }

  if (unique.length > 0) {
    return unique;
  }

  return cleanedLines
    .join(' ')
    .split(/(?<=[.!?])\s+/)
    .map(sentence => sentence.trim())
    .filter(sentence => sentence.length >= 12 && sentence.length <= 120)
    .slice(0, limit);
};
