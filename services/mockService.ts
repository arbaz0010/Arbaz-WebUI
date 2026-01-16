import { ChatSession, Message, AppSettings } from '../types';

// Simulate a delay for async operations
const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

export const MockService = {
  // Chat Persistence
  saveChats: (chats: ChatSession[]) => {
    localStorage.setItem('openllama_chats', JSON.stringify(chats));
  },

  loadChats: (): ChatSession[] => {
    const data = localStorage.getItem('openllama_chats');
    return data ? JSON.parse(data) : [];
  },

  // Settings Persistence
  saveSettings: (settings: AppSettings) => {
    localStorage.setItem('openllama_settings', JSON.stringify(settings));
  },

  loadSettings: (): AppSettings | null => {
    const data = localStorage.getItem('openllama_settings');
    return data ? JSON.parse(data) : null;
  },

  // Mock Inference API (Simulates a backend Python FastAPI stream)
  streamCompletion: async function* (
    messages: Message[],
    modelId: string,
    systemPrompt: string
  ): AsyncGenerator<string, void, unknown> {
    // In a real app, this would fetch() to the Python backend
    // const response = await fetch(`${settings.apiUrl}/chat/completions`, ...);
    
    // Simulating "thinking"
    await delay(600);

    const lastUserMessage = messages[messages.length - 1].content.toLowerCase();
    
    let fullResponse = "";
    if (lastUserMessage.includes("hello") || lastUserMessage.includes("hi")) {
      fullResponse = `Hello! I am running on the **${modelId}** model. How can I help you today?`;
    } else if (lastUserMessage.includes("code")) {
      fullResponse = `Here is a Python snippet using FastAPI:\n\n\`\`\`python\nfrom fastapi import FastAPI\n\napp = FastAPI()\n\n@app.get("/")\ndef read_root():\n    return {"Hello": "World"}\n\`\`\`\n\nThis code creates a basic web server.`;
    } else {
      fullResponse = `I received your message: "${messages[messages.length - 1].content}". \n\nSince I am a simulated local model in this frontend demo, I don't have real inference capabilities, but I am mimicking the streaming behavior of a local **llama.cpp** server instance running ${modelId}.`;
    }

    const tokens = fullResponse.split(/(?=[ \n])/); // Split by words/spaces roughly

    for (const token of tokens) {
      await delay(Math.random() * 30 + 10); // Random typing speed
      yield token;
    }
  }
};