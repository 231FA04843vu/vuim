// NOTE: rotate this key if it is ever shared publicly.
export const DEFAULT_OPENROUTER_API_KEY = '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';
export const OPENROUTER_API_URL = 'https://openrouter.ai/api/v1/chat/completions';
export const DEFAULT_OPENROUTER_MODEL = 'openrouter/auto';

export const OPENROUTER_FALLBACK_MODELS = [
	'openrouter/auto',
	'google/gemini-2.0-flash-001',
	'meta-llama/llama-3.1-8b-instruct:free',
];
