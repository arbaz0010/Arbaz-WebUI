
import React from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { Message } from '../types';
import { User, Copy, Check, Bot, FileText } from './Icon';

interface ChatMessageProps {
  message: Message;
}

const ChatMessage: React.FC<ChatMessageProps> = ({ message }) => {
  const isUser = message.role === 'user';
  const [copiedIndex, setCopiedIndex] = React.useState<number | null>(null);

  const handleCopy = (code: string, index: number) => {
    navigator.clipboard.writeText(code);
    setCopiedIndex(index);
    setTimeout(() => setCopiedIndex(null), 2000);
  };

  const components = {
    code(props: any) {
      const { children, className, node, ...rest } = props;
      const match = /language-(\w+)/.exec(className || '');
      const isInline = !match && !String(children).includes('\n');
      
      if (isInline) {
         return <code {...rest}>{children}</code>;
      }

      const codeString = String(children).replace(/\n$/, '');
      const blockIndex = Math.random(); 

      return (
        <div className="my-4 rounded-md overflow-hidden border border-gray-700 bg-[#0d1117] shadow-sm">
          <div className="code-header">
            <span className="capitalize">{match?.[1] || 'code'}</span>
            <button
              onClick={() => handleCopy(codeString, blockIndex)}
              className="flex items-center gap-1.5 hover:text-white transition-colors"
            >
               {copiedIndex === blockIndex ? <Check size={12} className="text-green-500"/> : <Copy size={12} />}
               <span>{copiedIndex === blockIndex ? 'Copied!' : 'Copy'}</span>
            </button>
          </div>
          <div className="code-block">
            <code style={{ fontFamily: 'monospace', fontSize: '0.875rem' }} {...rest}>
              {children}
            </code>
          </div>
        </div>
      );
    },
    table(props: any) {
        return (
            <div className="my-4 overflow-x-auto rounded-lg border border-gray-200 dark:border-gray-700">
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.875rem' }} {...props} />
            </div>
        )
    },
    thead(props: any) {
        return <thead style={{ backgroundColor: 'rgba(0,0,0,0.05)' }} {...props} />
    },
    th(props: any) {
        return <th style={{ padding: '0.75rem 1.5rem', textAlign: 'left', fontWeight: 600 }} {...props} />
    },
    td(props: any) {
        return <td style={{ padding: '1rem 1.5rem', borderTop: '1px solid var(--border)' }} {...props} />
    }
  };

  return (
    <div className="message-row">
        <div className="message-container">
            <div className="flex-shrink-0 flex flex-col relative items-end">
                <div className={`avatar ${isUser ? 'user' : 'bot'}`}>
                    {isUser ? <User size={16} /> : <Bot size={20} />}
                </div>
            </div>
            
            <div className="message-content">
                <div className="message-role">
                    {isUser ? 'You' : 'Llama'}
                </div>
                <div className="prose">
                    
                    {/* Attachments Display */}
                    {message.attachments && message.attachments.length > 0 && (
                        <div className="attachment-preview">
                            {message.attachments.map(att => (
                                <div key={att.id} className="attachment-card">
                                    {att.type === 'image' ? (
                                        <img src={att.preview || att.data} alt="attachment" style={{ maxHeight: '16rem', objectFit: 'cover' }} />
                                    ) : (
                                        <div className="flex items-center gap-2 p-3 bg-gray-50 dark:bg-gray-800">
                                            <FileText size={20} className="text-gray-500" />
                                            <div className="text-sm font-medium">{att.name}</div>
                                        </div>
                                    )}
                                </div>
                            ))}
                        </div>
                    )}

                    {isUser ? (
                        <div style={{ whiteSpace: 'pre-wrap' }}>{message.content}</div>
                    ) : (
                        <ReactMarkdown 
                          remarkPlugins={[remarkGfm]}
                          components={components}
                        >
                        {message.content}
                        </ReactMarkdown>
                    )}
                </div>
            </div>
        </div>
    </div>
  );
};

export default ChatMessage;
