import { useState, useRef, useEffect } from 'react';
import { aiApi } from '../lib/api';

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
}

export function ChatWidget() {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([
    { id: '1', role: 'assistant', content: 'Hi! I can help you analyze your spending. Ask me anything about your finances!' }
  ]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isOpen]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || isLoading) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      role: 'user',
      content: input.trim()
    };

    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setIsLoading(true);

    try {
      const response = await aiApi.chat(userMessage.content);
      
      const aiMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: response.response
      };
      setMessages(prev => [...prev, aiMessage]);
    } catch (error) {
      console.error('Chat error', error);
      const errorMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: 'Sorry, I encountered an error connecting to the financial assistant.'
      };
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed bottom-6 right-6 z-50 flex flex-col items-end pointer-events-none">
      {/* Chat Window */}
      <div 
        className={`pointer-events-auto bg-slate-900/90 backdrop-blur-xl border border-slate-700/50 rounded-2xl shadow-2xl w-80 sm:w-96 mb-4 transition-all duration-300 origin-bottom-right overflow-hidden flex flex-col ${
          isOpen 
            ? 'opacity-100 scale-100 translate-y-0 h-[500px]' 
            : 'opacity-0 scale-95 translate-y-4 h-0 pointer-events-none'
        }`}
      >
        {/* Header */}
        <div className="p-4 bg-gradient-to-r from-indigo-600/20 to-purple-600/20 border-b border-indigo-500/20 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-xl">🤖</span>
            <div>
              <h3 className="font-semibold text-white text-sm">Fintech AI</h3>
              <p className="text-xs text-indigo-300">Your personal assistant</p>
            </div>
          </div>
          <button 
            onClick={() => setIsOpen(false)}
            className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-white/5 transition-colors"
          >
            ✕
          </button>
        </div>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4 scrollbar-thin scrollbar-thumb-slate-700 scrollbar-track-transparent">
          {messages.map((msg) => (
            <div
              key={msg.id}
              className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
            >
              <div
                className={`max-w-[85%] rounded-2xl px-4 py-2.5 text-sm leading-relaxed whitespace-pre-wrap ${
                  msg.role === 'user'
                    ? 'bg-indigo-600 text-white rounded-br-none shadow-lg shadow-indigo-600/20'
                    : 'bg-slate-800 text-slate-200 rounded-bl-none border border-slate-700/50'
                }`}
              >
                {msg.content}
              </div>
            </div>
          ))}
          {isLoading && (
            <div className="flex justify-start">
              <div className="bg-slate-800 rounded-2xl rounded-bl-none px-4 py-3 border border-slate-700/50">
                <div className="flex gap-1">
                  <div className="w-1.5 h-1.5 bg-indigo-400 rounded-full animate-bounce [animation-delay:-0.3s]" />
                  <div className="w-1.5 h-1.5 bg-indigo-400 rounded-full animate-bounce [animation-delay:-0.15s]" />
                  <div className="w-1.5 h-1.5 bg-indigo-400 rounded-full animate-bounce" />
                </div>
              </div>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Input */}
        <form onSubmit={handleSubmit} className="p-3 border-t border-slate-700/50 bg-slate-900/50">
          <div className="relative">
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Ask about your budget..."
              className="w-full bg-slate-800/50 border border-slate-700 rounded-xl pl-4 pr-12 py-3 text-sm text-white focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500/50 transition-all placeholder:text-slate-500"
            />
            <button
              type="submit"
              disabled={!input.trim() || isLoading}
              className="absolute right-2 top-1/2 -translate-y-1/2 p-1.5 bg-indigo-600 text-white rounded-lg hover:bg-indigo-500 disabled:opacity-50 disabled:bg-slate-700 transition-colors"
            >
              ➤
            </button>
          </div>
        </form>
      </div>

      {/* FAB */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={`pointer-events-auto group relative flex items-center justify-center w-14 h-14 rounded-full shadow-lg shadow-indigo-500/30 transition-all duration-300 hover:scale-105 active:scale-95 ${
          isOpen ? 'bg-slate-800 text-slate-400 rotate-90' : 'bg-gradient-to-r from-indigo-600 to-purple-600 text-white'
        }`}
      >
        {/* Glow effect */}
        {!isOpen && (
          <div className="absolute inset-0 rounded-full bg-indigo-500 blur opacity-40 animate-pulse group-hover:opacity-60" />
        )}
        <span className="relative text-2xl">
          {isOpen ? '✕' : '✨'}
        </span>
      </button>
    </div>
  );
}
