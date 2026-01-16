
import { ChatSession, Message, AppSettings } from '../types';

// --- MOCK LOGIC ---
const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

async function* mockStreamGenerator(
  messages: Message[],
  modelId: string
): AsyncGenerator<string, void, unknown> {
  await delay(600);
  const lastMsg = messages[messages.length - 1];
  const lastUserMessage = lastMsg.content.toLowerCase();
  
  let fullResponse = "";
  if (lastMsg.attachments && lastMsg.attachments.length > 0) {
     fullResponse = `I see you uploaded ${lastMsg.attachments.length} attachment(s). In mock mode, I can't analyze them, but they are properly passed in the message structure.`;
  } else if (lastUserMessage.includes("hello") || lastUserMessage.includes("hi")) {
    fullResponse = `Hello! I am running on the **${modelId}** model (Mock Mode). How can I help you today?`;
  } else if (lastUserMessage.includes("code")) {
    fullResponse = `Here is a Python snippet:\n\n\`\`\`python\nprint("Hello World")\n\`\`\``;
  } else {
    fullResponse = `I received your message: "${messages[messages.length - 1].content}". (Mock Response)`;
  }

  const tokens = fullResponse.split(/(?=[ \n])/);
  for (const token of tokens) {
    await delay(Math.random() * 30 + 10);
    yield token;
  }
}

// --- BROWSER LOGIC (Transformers.js) ---
let browserPipeline: any = null;
let currentLoadedModel = "";

async function* browserStreamGenerator(
  messages: Message[],
  modelId: string,
  settings: AppSettings
): AsyncGenerator<string, void, unknown> {
  try {
    const { pipeline, TextStreamer, env } = await import('@xenova/transformers');
    env.allowLocalModels = false;
    env.useBrowserCache = true;

    if (!browserPipeline || currentLoadedModel !== modelId) {
      yield `*Initializing ${modelId}...*\n`;
      const p = await pipeline('text-generation', modelId);
      browserPipeline = p;
      currentLoadedModel = modelId;
    }

    let prompt = "";
    if (settings.systemPrompt) prompt += `<|system|>\n${settings.systemPrompt}</s>\n`;
    for (const msg of messages) {
        // Flatten attachments into text for standard text models
        let content = msg.content;
        if (msg.attachments?.length) {
            const textFiles = msg.attachments.filter(a => a.type === 'file');
            if (textFiles.length > 0) {
                content += "\n\nAttached Files:\n" + textFiles.map(f => `--- ${f.name} ---\n${f.data}\n---`).join('\n');
            }
        }
        prompt += `<|${msg.role}|>\n${content}</s>\n`;
    }
    prompt += `<|assistant|>\n`;

    const tokenQueue: string[] = [];
    let resolveNext: ((v?: any) => void) | null = null;
    let isDone = false;

    const streamer = new TextStreamer(browserPipeline.tokenizer, {
      skip_prompt: true,
      skip_special_tokens: true,
      callback_function: (text: string) => {
        tokenQueue.push(text);
        if (resolveNext) { resolveNext(); resolveNext = null; }
      }
    });

    browserPipeline(prompt, {
      max_new_tokens: settings.maxTokens || 1024,
      temperature: settings.temperature,
      top_p: settings.topP,
      top_k: settings.topK,
      do_sample: true,
      streamer: streamer,
      repetition_penalty: settings.repeatPenalty
    }).then(() => {
      isDone = true;
      if (resolveNext) resolveNext();
    });

    while (!isDone || tokenQueue.length > 0) {
      if (tokenQueue.length > 0) {
        yield tokenQueue.shift()!;
      } else {
        await new Promise<void>(resolve => { resolveNext = resolve; });
      }
    }
  } catch (error: any) {
    yield `Error: ${error.message}`;
  }
}

// --- REAL API LOGIC ---

async function* apiStreamGenerator(
    messages: Message[],
    modelId: string,
    settings: AppSettings
): AsyncGenerator<string, void, unknown> {
    try {
      const apiMessages = [
        { role: 'system', content: settings.systemPrompt },
        ...messages.map(m => {
            // Check if there are attachments
            if (!m.attachments || m.attachments.length === 0) {
                return { role: m.role, content: m.content };
            }

            // Construct Multi-modal message (OpenAI Vision Format)
            const contentParts: any[] = [];
            
            // Add text content if present
            if (m.content) {
                contentParts.push({ type: "text", text: m.content });
            }

            // Process attachments
            m.attachments.forEach(att => {
                if (att.type === 'image') {
                    contentParts.push({
                        type: "image_url",
                        image_url: {
                            url: att.data // Expecting data:image/... base64
                        }
                    });
                } else if (att.type === 'file') {
                    // For text files, just append to text for now
                    // Ideally we should start using context stuffing
                    const existingText = contentParts.find(p => p.type === 'text');
                    const fileText = `\n[File: ${att.name}]\n${att.data}\n`;
                    if (existingText) {
                        existingText.text += fileText;
                    } else {
                        contentParts.push({ type: "text", text: fileText });
                    }
                }
            });

            return { role: m.role, content: contentParts };
        })
      ];

      let url = settings.apiUrl;
      if (!url.endsWith('/chat/completions')) {
        url = url.replace(/\/+$/, '') + '/chat/completions';
      }

      const body = {
        model: modelId,
        messages: apiMessages,
        stream: true,
        temperature: settings.temperature,
        top_p: settings.topP,
        max_tokens: settings.maxTokens,
        presence_penalty: settings.presencePenalty,
        frequency_penalty: settings.frequencyPenalty,
        seed: settings.seed === -1 ? undefined : settings.seed,
        top_k: settings.topK,
        min_p: settings.minP,
        repeat_penalty: settings.repeatPenalty,
        repeat_last_n: settings.repeatLastN,
        mirostat: settings.mirostat,
        mirostat_tau: settings.mirostatTau,
        mirostat_eta: settings.mirostatEta,
        cache_prompt: true,
      };

      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${settings.apiKey || 'no-key'}`
        },
        body: JSON.stringify(body),
      });

      if (!response.ok) {
        const err = await response.text();
        yield `**API Error**: ${response.status}\n\`${err}\``;
        return;
      }

      if (!response.body) return;

      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let buffer = '';

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split('\n');
        buffer = lines.pop() || '';

        for (const line of lines) {
          const trimmed = line.trim();
          if (!trimmed.startsWith('data: ')) continue;
          const dataStr = trimmed.slice(6);
          if (dataStr === '[DONE]') continue;
          try {
            const json = JSON.parse(dataStr);
            const content = json.choices?.[0]?.delta?.content;
            if (content) yield content;
          } catch (e) { /* ignore parse err */ }
        }
      }
    } catch (error: any) {
      yield `\n\n**Connection Error**: ${error.message}`;
    }
}

export const ChatService = {
  saveChats: (chats: ChatSession[]) => {
    localStorage.setItem('openllama_chats', JSON.stringify(chats));
  },
  loadChats: (): ChatSession[] => {
    const data = localStorage.getItem('openllama_chats');
    return data ? JSON.parse(data) : [];
  },
  saveSettings: (settings: AppSettings) => {
    localStorage.setItem('openllama_settings', JSON.stringify(settings));
  },
  loadSettings: (): AppSettings | null => {
    const data = localStorage.getItem('openllama_settings');
    return data ? JSON.parse(data) : null;
  },
  streamCompletion: async function* (
    messages: Message[],
    modelId: string,
    settings: AppSettings
  ): AsyncGenerator<string, void, unknown> {
    if (settings.backend === 'browser') {
      yield* browserStreamGenerator(messages, modelId, settings);
    } else if (settings.backend === 'mock') {
      yield* mockStreamGenerator(messages, modelId);
    } else {
      yield* apiStreamGenerator(messages, modelId, settings);
    }
  }
};
