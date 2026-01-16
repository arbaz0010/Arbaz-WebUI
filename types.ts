
export interface User {
  id: string;
  username: string;
  email: string;
  token: string;
  role: 'admin' | 'user';
}

export interface Attachment {
  id: string;
  type: 'image' | 'file';
  name: string;
  mimeType: string;
  data: string; // Base64 or text content
  preview?: string; // For images
}

export interface Message {
  id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  attachments?: Attachment[];
  timestamp: number;
}

export interface ChatSession {
  id: string;
  title: string;
  modelId: string;
  messages: Message[];
  updatedAt: number;
}

export interface AppSettings {
  theme: 'light' | 'dark';
  apiUrl: string;
  apiKey: string;
  defaultModel: string;
  streamResponse: boolean;
  systemPrompt: string;
  backend: 'api' | 'browser' | 'mock';
  
  // Advanced Generation Parameters
  temperature: number;
  topP: number;
  topK: number;
  minP: number;
  maxTokens: number;
  
  // Penalties
  repeatPenalty: number;     // repeat_penalty
  repeatLastN: number;       // repeat_last_n
  presencePenalty: number;   // presence_penalty
  frequencyPenalty: number;  // frequency_penalty
  
  // Advanced
  seed: number;              // -1 for random
  mirostat: number;          // 0 = disabled, 1 = mirostat, 2 = mirostat 2.0
  mirostatTau: number;
  mirostatEta: number;
}

export interface Model {
  id: string;
  name: string;
  description: string;
  contextWindow: number;
}
