
import React, { useState, useEffect, useRef } from 'react';
import { HashRouter } from 'react-router-dom';
import { 
  Menu, Plus, Settings, LogOut, Send, 
  X, Mic, MicOff, SlidersHorizontal, Trash2, 
  ArrowUp, Activity, MoreHorizontal, User as UserIcon,
  Bot, ChevronDown, Sparkles, Globe, Brain, Code2, 
  BookOpen, BarChart3, Paperclip, FileText, Image as ImageIcon
} from './components/Icon';
import Auth from './components/Auth';
import ChatMessage from './components/ChatMessage';
import SettingsModal from './components/SettingsModal';
import { User, ChatSession, Message, AppSettings, Attachment } from './types';
import { DEFAULT_SETTINGS, DEFAULT_MODELS } from './constants';
import { ChatService } from './services/chatService';

// --- Helpers ---
const groupChatsByDate = (chats: ChatSession[]) => {
  const groups: { [key: string]: ChatSession[] } = {
    'Today': [],
    'Yesterday': [],
    'Previous 7 Days': [],
    'Older': []
  };

  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
  const yesterday = today - 86400000;
  const lastWeek = today - 86400000 * 7;

  chats.forEach(chat => {
    if (chat.updatedAt >= today) groups['Today'].push(chat);
    else if (chat.updatedAt >= yesterday) groups['Yesterday'].push(chat);
    else if (chat.updatedAt >= lastWeek) groups['Previous 7 Days'].push(chat);
    else groups['Older'].push(chat);
  });

  return groups;
};

function App() {
  // --- State ---
  const [user, setUser] = useState<User | null>(null);
  const [settings, setSettings] = useState<AppSettings>(DEFAULT_SETTINGS);
  const [chats, setChats] = useState<ChatSession[]>([]);
  const [currentChatId, setCurrentChatId] = useState<string | null>(null);
  const [input, setInput] = useState('');
  const [isSidebarOpen, setIsSidebarOpen] = useState(true); // Default open on desktop
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  
  // Tools & Attachments State
  const [showUploadMenu, setShowUploadMenu] = useState(false);
  const [showExtensionsMenu, setShowExtensionsMenu] = useState(false);
  
  const [activeTools, setActiveTools] = useState({
    webSearch: false,
    reasoning: false,
    code: false,
    agentic: false,
    research: false,
    analyze: false
  });
  const [attachments, setAttachments] = useState<Attachment[]>([]);
  
  // UI State
  const [showModelMenu, setShowModelMenu] = useState(false);
  
  // Generation State
  const [isGenerating, setIsGenerating] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [genStats, setGenStats] = useState<{
    startTime: number;
    tokenCount: number;
    tokensPerSec: number;
    duration: number;
  } | null>(null);

  const abortControllerRef = useRef<AbortController | null>(null);
  const recognitionRef = useRef<any>(null);

  // --- Refs ---
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const chatContainerRef = useRef<HTMLDivElement>(null);
  const uploadMenuRef = useRef<HTMLDivElement>(null);
  const extensionsMenuRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // --- Effects ---
  useEffect(() => {
    const savedSettings = ChatService.loadSettings();
    if (savedSettings) setSettings(savedSettings);

    const savedChats = ChatService.loadChats();
    savedChats.sort((a, b) => b.updatedAt - a.updatedAt);
    setChats(savedChats);
    
    if (savedChats.length > 0) {
      setCurrentChatId(savedChats[0].id);
    } else {
      createNewChat();
    }

    if (savedSettings?.theme === 'dark' || (!savedSettings && window.matchMedia('(prefers-color-scheme: dark)').matches)) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }

    if (window.innerWidth < 768) {
      setIsSidebarOpen(false);
    }
  }, []);

  useEffect(() => {
    if (chats.length > 0) ChatService.saveChats(chats);
  }, [chats]);

  useEffect(() => {
    ChatService.saveSettings(settings);
    if (settings.theme === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [settings]);

  // Click outside listener for Menus
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (uploadMenuRef.current && !uploadMenuRef.current.contains(event.target as Node)) {
        setShowUploadMenu(false);
      }
      if (extensionsMenuRef.current && !extensionsMenuRef.current.contains(event.target as Node)) {
        setShowExtensionsMenu(false);
      }
    };
    if (showUploadMenu || showExtensionsMenu) document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [showUploadMenu, showExtensionsMenu]);

  // Auto-scroll
  useEffect(() => {
    if (isGenerating) {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [chats, isGenerating]);

  // Auto-resize textarea
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = input ? `${Math.min(textareaRef.current.scrollHeight, 200)}px` : '56px';
    }
  }, [input]);

  // --- Actions ---

  const handleLogin = (token: string, username: string, role: 'admin' | 'user') => {
    setUser({ id: '1', username, email: `${username}@local.host`, token, role });
  };

  const handleLogout = () => setUser(null);

  const createNewChat = () => {
    const newChat: ChatSession = {
      id: Date.now().toString(),
      title: 'New Chat',
      modelId: settings.defaultModel,
      messages: [],
      updatedAt: Date.now(),
    };
    setChats(prev => [newChat, ...prev]);
    setCurrentChatId(newChat.id);
    setGenStats(null);
    setInput('');
    setAttachments([]);
    if (window.innerWidth < 768) setIsSidebarOpen(false);
  };

  const deleteChat = (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    const newChats = chats.filter(c => c.id !== id);
    setChats(newChats);
    if (currentChatId === id) {
      setCurrentChatId(newChats.length > 0 ? newChats[0].id : null);
      if (newChats.length === 0) createNewChat();
    }
  };

  const updateChatTitle = (chatId: string, title: string) => {
    setChats(prev => prev.map(c => c.id === chatId ? { ...c, title } : c));
  };

  const toggleTool = (key: keyof typeof activeTools) => {
    setActiveTools(prev => ({ ...prev, [key]: !prev[key] }));
  };

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
        const file = e.target.files[0];
        const isImage = file.type.startsWith('image/');
        
        const reader = new FileReader();
        reader.onload = (ev) => {
            const data = ev.target?.result as string;
            setAttachments(prev => [...prev, {
                id: Date.now().toString(),
                type: isImage ? 'image' : 'file',
                name: file.name,
                mimeType: file.type,
                data: data, 
                preview: isImage ? data : undefined
            }]);
            setShowUploadMenu(false);
        };
        
        if (isImage) {
            reader.readAsDataURL(file);
        } else {
            reader.readAsText(file);
        }
    }
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const removeAttachment = (id: string) => {
      setAttachments(prev => prev.filter(a => a.id !== id));
  };

  const handleSendMessage = async () => {
    if ((!input.trim() && attachments.length === 0) || !currentChatId || isGenerating) return;

    if (isListening && recognitionRef.current) {
      recognitionRef.current.stop();
      setIsListening(false);
    }

    const activeChat = chats.find(c => c.id === currentChatId);
    if (!activeChat) return;

    const userMsg: Message = {
      id: Date.now().toString(),
      role: 'user',
      content: input,
      attachments: [...attachments],
      timestamp: Date.now(),
    };

    const updatedChat = {
      ...activeChat,
      messages: [...activeChat.messages, userMsg],
      updatedAt: Date.now(),
    };
    
    if (activeChat.messages.length === 0) {
        updatedChat.title = input.slice(0, 30) + (input.length > 30 ? '...' : '') || 'New Attachment';
    }

    setChats(prev => {
        const others = prev.filter(c => c.id !== currentChatId);
        return [updatedChat, ...others];
    });

    setInput('');
    setAttachments([]);
    setIsGenerating(true);
    setGenStats({ startTime: Date.now(), tokenCount: 0, tokensPerSec: 0, duration: 0 });
    
    abortControllerRef.current = new AbortController();
    const assistantMsgId = (Date.now() + 1).toString();
    let currentResponse = "";
    
    let tokenCount = 0;
    const startTime = Date.now();

    try {
      const generator = ChatService.streamCompletion(
        updatedChat.messages, 
        activeChat.modelId, 
        settings 
      );

      for await (const chunk of generator) {
        if (abortControllerRef.current?.signal.aborted) break;

        currentResponse += chunk;
        tokenCount++;
        const now = Date.now();
        const duration = (now - startTime) / 1000;
        setGenStats({
           startTime,
           tokenCount,
           tokensPerSec: duration > 0 ? parseFloat((tokenCount / duration).toFixed(1)) : 0,
           duration: parseFloat(duration.toFixed(1))
        });

        setChats(prev => prev.map(c => {
          if (c.id === currentChatId) {
            const msgs = [...c.messages];
            const lastMsg = msgs[msgs.length - 1];
            if (lastMsg.role === 'assistant' && lastMsg.id === assistantMsgId) {
              lastMsg.content = currentResponse;
            } else {
              msgs.push({
                id: assistantMsgId,
                role: 'assistant',
                content: currentResponse,
                timestamp: Date.now()
              });
            }
            return { ...c, messages: msgs };
          }
          return c;
        }));
      }
    } catch (err) {
      console.error("Failed to generate", err);
    } finally {
      setIsGenerating(false);
      abortControllerRef.current = null;
    }
  };

  const handleStop = () => {
    if (abortControllerRef.current) {
        abortControllerRef.current.abort();
        abortControllerRef.current = null;
    }
    setIsGenerating(false);
  };

  // --- Render ---

  if (!user) return <Auth onLogin={handleLogin} />;

  const activeChat = chats.find(c => c.id === currentChatId) || chats[0];
  const groupedChats = groupChatsByDate(chats);
  const activeModel = DEFAULT_MODELS.find(m => m.id === (activeChat?.modelId || settings.defaultModel));

  return (
    <HashRouter>
      <div className="app-layout">
        
        {/* Hidden File Input */}
        <input 
            type="file" 
            ref={fileInputRef} 
            className="hidden" 
            onChange={handleFileSelect} 
            accept="image/*,.txt,.md,.json,.js,.py,.ts,.tsx,.csv"
        />

        {/* Mobile Overlay */}
        {isSidebarOpen && (
          <div 
            className="mobile-overlay md:hidden"
            onClick={() => setIsSidebarOpen(false)}
          />
        )}

        {/* --- Sidebar --- */}
        <div className={`sidebar ${!isSidebarOpen ? 'closed' : ''}`}>
          {/* Sidebar Header */}
          <div className="sidebar-header">
             <button 
               onClick={() => {
                   createNewChat();
                   if (window.innerWidth < 768) setIsSidebarOpen(false);
               }}
               className="new-chat-btn group"
             >
               <span className="flex items-center gap-2">
                 <div className="icon-box white p-0-5"><Plus size={14} strokeWidth={3} /></div>
                 New chat
               </span>
               <span className="opacity-0 group-hover:opacity-100"><Bot size={16} /></span>
             </button>
          </div>

          {/* Chat History List */}
          <div className="sidebar-content">
            {Object.entries(groupedChats).map(([label, groupChats]) => (
                groupChats.length > 0 && (
                    <div key={label} className="mb-6">
                        <div className="chat-group-label">{label}</div>
                        <div className="space-y-0.5">
                            {groupChats.map(chat => (
                                <div 
                                    key={chat.id}
                                    onClick={() => {
                                        setCurrentChatId(chat.id);
                                        if (window.innerWidth < 768) setIsSidebarOpen(false);
                                    }}
                                    className={`chat-item group ${currentChatId === chat.id ? 'active' : ''}`}
                                >
                                    <span className="flex-1 truncate">{chat.title}</span>
                                    {currentChatId === chat.id && (
                                        <div className="flex items-center gap-1">
                                            <button 
                                                onClick={(e) => deleteChat(e, chat.id)}
                                                className="text-gray-400 hover:text-white p-1"
                                            >
                                                <Trash2 size={14} />
                                            </button>
                                        </div>
                                    )}
                                </div>
                            ))}
                        </div>
                    </div>
                )
            ))}
          </div>

          {/* Sidebar Footer */}
          <div className="sidebar-footer">
             <button onClick={() => setIsSettingsOpen(true)} className="flex items-center gap-3 w-full p-3 rounded-lg hover:bg-gray-900 text-sm transition-colors mb-1">
                <Settings size={18} />
                <span>Settings</span>
             </button>
             <div className="user-profile" onClick={handleLogout}>
                <div className="flex items-center gap-3">
                    <div className="icon-box green w-8 h-8 font-bold text-xs" style={{ width: '2rem', height: '2rem' }}>
                        {user.username.slice(0,2).toUpperCase()}
                    </div>
                    <div className="flex flex-col">
                        <span className="text-sm font-medium text-white">{user.username}</span>
                        <span className="text-xs text-gray-500">Free Plan</span>
                    </div>
                </div>
                <LogOut size={16} className="text-gray-500" />
             </div>
          </div>
        </div>

        {/* --- Main Area --- */}
        <div className="main-content">
          
          {/* Header (Model Selector) */}
          <div className="header">
             <div className="flex items-center gap-2">
                <button 
                   onClick={() => setIsSidebarOpen(!isSidebarOpen)} 
                   className="md:hidden p-2 text-gray-500 hover:text-gray-900 dark:hover:text-gray-100"
                >
                   <Menu size={24} />
                </button>
                <div className="relative">
                   <button 
                     onClick={() => setShowModelMenu(!showModelMenu)}
                     className="model-selector-btn"
                   >
                     {activeModel?.name || settings.defaultModel} 
                     <span className="opacity-50 text-sm"><ChevronDown size={14} /></span>
                   </button>
                   
                   {/* Dropdown */}
                   {showModelMenu && (
                     <div className="model-dropdown">
                        {DEFAULT_MODELS.map(model => (
                            <button
                                key={model.id}
                                onClick={() => {
                                    setSettings(prev => ({ ...prev, defaultModel: model.id }));
                                    updateChatTitle(currentChatId || '', `Chat with ${model.name}`);
                                    setShowModelMenu(false);
                                }}
                                className="model-option"
                            >
                                <div className="icon-box gray p-2"><Sparkles size={16} className="text-primary"/></div>
                                <div>
                                    <div className="text-sm font-medium dark:text-gray-200">{model.name}</div>
                                    <div className="text-xs text-gray-500">{model.description.slice(0, 30)}...</div>
                                </div>
                                {model.id === settings.defaultModel && <div className="ml-auto text-primary"><ArrowUp size={16} className="rotate-45" /></div>}
                            </button>
                        ))}
                     </div>
                   )}
                </div>
             </div>
             {/* Stats Pill */}
             {genStats && (
                <div className="hidden md:flex items-center gap-3 px-3 py-1 bg-gray-100 dark:bg-gray-800/50 rounded-full text-xs font-mono text-gray-500 border border-gray-200 dark:border-gray-700/50">
                    <Activity size={12} className={isGenerating ? 'text-green-500' : ''} />
                    <span>{genStats.tokensPerSec} T/s</span>
                    <span className="text-gray-300 dark:text-gray-600">|</span>
                    <span>{genStats.duration}s</span>
                </div>
             )}
          </div>

          {/* Chat Scroll Area */}
          <div ref={chatContainerRef} className="chat-scroll-area">
             {!activeChat || activeChat.messages.length === 0 ? (
                 <div className="empty-state">
                    <div className="bg-white dark:bg-gray-800 p-4 rounded-full shadow-sm mb-6">
                        <Bot size={48} className="text-gray-900 dark:text-white" />
                    </div>
                    <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">How can I help you today?</h2>
                 </div>
             ) : (
                 <div className="flex flex-col max-w-3xl mx-auto w-full">
                     {activeChat.messages.map((msg, idx) => (
                         <ChatMessage key={idx} message={msg} />
                     ))}
                     {isGenerating && <div className="h-12" />}
                     <div ref={messagesEndRef} />
                 </div>
             )}
          </div>

          {/* Input Area */}
          <div className="input-area-wrapper">
             <div className="input-container-max-width">
                
                {/* Upload Menu Popover */}
                {showUploadMenu && (
                    <div ref={uploadMenuRef} className="popover-menu" style={{ width: '12rem', left: 0 }}>
                         <div className="menu-header">Upload</div>
                         <div className="flex flex-col p-1-5 gap-1">
                            <button onClick={() => fileInputRef.current?.click()} className="menu-item rounded-lg">
                                <div className="icon-box blue p-1-5"><ImageIcon size={16} /></div>
                                <span className="text-sm font-medium dark:text-gray-200">Image</span>
                            </button>
                            <button onClick={() => fileInputRef.current?.click()} className="menu-item rounded-lg">
                                <div className="icon-box green p-1-5"><Paperclip size={16} /></div>
                                <span className="text-sm font-medium dark:text-gray-200">File</span>
                            </button>
                         </div>
                    </div>
                )}

                {/* Extensions Menu Popover */}
                {showExtensionsMenu && (
                    <div ref={extensionsMenuRef} className="popover-menu" style={{ width: '18rem', left: '3rem' }}>
                        <div className="menu-header flex items-center gap-2">
                            <SlidersHorizontal size={12} className="text-primary" /> 
                            Extensions
                        </div>
                        <div className="p-2 max-h-[300px] overflow-y-auto">
                            {[
                                { key: 'webSearch', label: 'Web Search', icon: Globe, colorType: 'blue', desc: 'Browse the internet' },
                                { key: 'reasoning', label: 'Reasoning', icon: Brain, colorType: 'green', desc: 'Advanced logic' },
                                { key: 'code', label: 'Code Interpreter', icon: Code2, colorType: 'gray', desc: 'Execute code' },
                                { key: 'agentic', label: 'Agentic Mode', icon: Bot, colorType: 'blue', desc: 'Auto-execution' },
                                { key: 'research', label: 'Deep Research', icon: BookOpen, colorType: 'green', desc: 'Paper analysis' },
                                { key: 'analyze', label: 'Data Analysis', icon: BarChart3, colorType: 'gray', desc: 'Visualize data' },
                            ].map((tool) => (
                                <div 
                                    key={tool.key}
                                    onClick={() => toggleTool(tool.key as any)}
                                    className="menu-item rounded-xl justify-between group cursor-pointer"
                                >
                                    <div className="flex items-center gap-3">
                                        <div 
                                            className={`icon-box p-2 transition-colors ${activeTools[tool.key as keyof typeof activeTools] ? '!bg-primary text-white' : `${tool.colorType}`}`}
                                        >
                                            <tool.icon size={16} />
                                        </div>
                                        <div>
                                            <div className="text-sm font-medium text-gray-900 dark:text-gray-200">{tool.label}</div>
                                            <div className="text-xs text-gray-500 dark:text-gray-400 leading-none mt-0.5">{tool.desc}</div>
                                        </div>
                                    </div>
                                    <div className={`w-9 h-5 rounded-full relative transition-colors ${activeTools[tool.key as keyof typeof activeTools] ? 'bg-primary' : 'bg-gray-300 dark:bg-gray-600'}`} style={{ width: '2.25rem', height: '1.25rem' }}>
                                        <div className={`absolute top-1 left-1 w-3 h-3 bg-white rounded-full transition-transform ${activeTools[tool.key as keyof typeof activeTools] ? 'translate-x-4' : ''}`} style={{ width: '0.75rem', height: '0.75rem', top: '0.25rem', left: '0.25rem', transform: activeTools[tool.key as keyof typeof activeTools] ? 'translateX(1rem)' : 'none', transition: 'transform 0.2s' }} />
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                )}
                
                {/* Input Container */}
                <div className="input-box">
                    
                    {/* Attachments Preview */}
                    {attachments.length > 0 && (
                        <div className="attachment-preview p-3 pb-0">
                            {attachments.map(att => (
                                <div key={att.id} className="relative group flex-shrink-0">
                                    <div className="w-16 h-16 rounded-xl border border-gray-200 dark:border-gray-600 overflow-hidden bg-white dark:bg-gray-800 flex items-center justify-center" style={{ width: '4rem', height: '4rem' }}>
                                        {att.type === 'image' && att.preview ? (
                                            <img src={att.preview} alt="preview" className="w-full h-full object-cover" />
                                        ) : (
                                            <FileText className="text-gray-400" size={24} />
                                        )}
                                    </div>
                                    <button 
                                        onClick={() => removeAttachment(att.id)}
                                        className="absolute -top-1.5 -right-1.5 bg-gray-900 text-white rounded-full p-0.5 shadow-md opacity-0 group-hover:opacity-100 transition-opacity"
                                    >
                                        <X size={12} />
                                    </button>
                                </div>
                            ))}
                        </div>
                    )}

                    <textarea
                        ref={textareaRef}
                        value={input}
                        onChange={(e) => setInput(e.target.value)}
                        onKeyDown={(e) => {
                            if (e.key === 'Enter' && !e.shiftKey) {
                                e.preventDefault();
                                handleSendMessage();
                            }
                        }}
                        placeholder="Message OpenLlama..."
                        rows={1}
                        className="input-textarea"
                    />
                    
                    <div className="input-actions">
                        <div className="flex items-center gap-1">
                             <button 
                               onClick={() => setShowUploadMenu(!showUploadMenu)}
                               className={`action-btn ${showUploadMenu ? 'active' : ''}`}
                             >
                                <Plus size={20} className={`transition-transform duration-200 ${showUploadMenu ? 'rotate-45' : ''}`} />
                             </button>

                             <button 
                                onClick={() => setShowExtensionsMenu(!showExtensionsMenu)}
                                className={`action-btn ${showExtensionsMenu ? 'active' : ''}`}
                             >
                                <SlidersHorizontal size={18} />
                             </button>
                        </div>
                        <div className="flex items-center gap-2">
                             {(input.trim() || attachments.length > 0) || isGenerating ? (
                                 <button 
                                    onClick={isGenerating ? handleStop : handleSendMessage}
                                    className={`send-btn ${isGenerating ? 'bg-transparent border-2 border-gray-800 dark:border-white' : ''}`}
                                 >
                                    {isGenerating ? <div className="w-2.5 h-2.5 bg-gray-800 dark:bg-white rounded-sm" style={{ width: '0.625rem', height: '0.625rem' }} /> : <ArrowUp size={20} strokeWidth={2.5} />}
                                 </button>
                             ) : (
                                <button 
                                    onClick={() => {
                                        const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
                                        if (SpeechRecognition) {
                                            if (isListening) {
                                                recognitionRef.current?.stop();
                                                setIsListening(false);
                                            } else {
                                                const recognition = new SpeechRecognition();
                                                recognition.onresult = (e: any) => {
                                                    const transcript = Array.from(e.results).map((r: any) => r[0].transcript).join('');
                                                    setInput(prev => prev + ' ' + transcript);
                                                };
                                                recognition.onend = () => setIsListening(false);
                                                recognitionRef.current = recognition;
                                                recognition.start();
                                                setIsListening(true);
                                            }
                                        }
                                    }}
                                    className={`send-btn ${isListening ? 'bg-red-500 dark:bg-red-500' : ''}`}
                                >
                                    {isListening ? <MicOff size={20} /> : <Mic size={20} />}
                                </button>
                             )}
                        </div>
                    </div>
                </div>
                
                <div className="text-center mt-2">
                    <p className="text-xs text-gray-400 dark:text-gray-500" style={{ fontSize: '0.65rem' }}>
                        Llama models can make mistakes. Consider checking important information.
                    </p>
                </div>
             </div>
          </div>
        </div>

        <SettingsModal 
          isOpen={isSettingsOpen} 
          onClose={() => setIsSettingsOpen(false)} 
          settings={settings}
          onSave={setSettings}
        />
      </div>
    </HashRouter>
  );
}

export default App;
