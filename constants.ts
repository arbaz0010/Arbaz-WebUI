
import { Model, AppSettings } from './types';

export const DEFAULT_MODELS: Model[] = [
  // Local API Models
  { id: 'local-model', name: 'Current Local Model (GGUF)', description: 'The model currently loaded in llama.cpp', contextWindow: 8192 },
  { id: 'llama-3-8b-instruct', name: 'Llama 3 (8B)', description: 'Meta Llama 3', contextWindow: 8192 },
  { id: 'mistral-7b-instruct', name: 'Mistral 7B', description: 'Mistral AI', contextWindow: 4096 },
  
  // Browser Models (Transformers.js)
  { id: 'Xenova/TinyLlama-1.1B-Chat-v1.0', name: 'TinyLlama 1.1B (Browser)', description: 'Runs in-browser (~600MB download)', contextWindow: 2048 },
  { id: 'Xenova/Qwen1.5-0.5B-Chat', name: 'Qwen 1.5 0.5B (Browser)', description: 'Fast in-browser model (~300MB)', contextWindow: 4096 },
];

export const DEFAULT_SETTINGS: AppSettings = {
  theme: 'dark',
  // Use relative path for API so it works on localhost AND VPS without config changes
  // Nginx will proxy /v1 to http://llama-server:8080/v1
  apiUrl: '/v1',
  apiKey: '',
  defaultModel: 'local-model',
  streamResponse: true,
  systemPrompt: 'You are a helpful AI assistant.',
  backend: 'api',
  
  // Standard Defaults
  temperature: 0.8,
  topP: 0.95,
  topK: 40,
  minP: 0.05,
  maxTokens: 4096,
  
  // Penalties
  repeatPenalty: 1.1,
  repeatLastN: 64,
  presencePenalty: 0.0,
  frequencyPenalty: 0.0,

  // Advanced
  seed: -1,
  mirostat: 0,
  mirostatTau: 5.0,
  mirostatEta: 0.1,
};

export const MOCK_USER_TOKEN = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.mock-token';
