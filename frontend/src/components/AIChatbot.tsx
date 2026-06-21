import { useState, useRef, useEffect } from 'react';
import { MessageSquare, X, Send, Sparkles } from 'lucide-react';
import api from '../utils/api';

interface Message {
  sender: 'user' | 'ai';
  text: string;
}

export default function AIChatbot() {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([
    { sender: 'ai', text: 'Namaste! I am BuildFlow AI, your site project analyst. Ask me about stock levels, budget status, labour costs, or supplier orders!' }
  ]);
  const [input, setInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const chatEndRef = useRef<HTMLDivElement>(null);

  const suggestedQuestions = [
    'How much cement is left?',
    'Which projects are delayed?',
    'Show labour expenses.',
    'Which vendors have pending payments?'
  ];

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isTyping]);

  const handleSend = async (text: string) => {
    if (!text.trim()) return;

    setMessages(prev => [...prev, { sender: 'user', text }]);
    setInput('');
    setIsTyping(true);

    try {
      const response = await api.sendMessageToAI(text);
      setMessages(prev => [...prev, { sender: 'ai', text: response.text }]);
    } catch {
      setMessages(prev => [...prev, { sender: 'ai', text: 'Sorry, I am facing a connection drop. I will re-verify our project notebook logs.' }]);
    } finally {
      setIsTyping(false);
    }
  };

  return (
    <div className="fixed bottom-6 right-64 z-50 font-sans">
      {/* Bot Chat Trigger Button */}
      {!isOpen && (
        <button
          onClick={() => setIsOpen(true)}
          className="bg-primary text-white p-3.5 rounded-full shadow-2xl hover:scale-105 active:scale-95 transition-all duration-200 border border-primary/20 pulse-glow flex items-center justify-center"
          title="BuildFlow AI Assistant"
        >
          <MessageSquare className="w-5.5 h-5.5 animate-pulse" />
        </button>
      )}

      {/* Floating Chat Container */}
      {isOpen && (
        <div className="w-[380px] h-[500px] bg-white dark:bg-zinc-950 border border-border rounded-2xl shadow-2xl flex flex-col overflow-hidden animate-in slide-in-from-bottom-5">
          {/* Header */}
          <div className="bg-primary/5 dark:bg-primary/10 border-b border-border p-4 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-lg bg-primary/20 flex items-center justify-center">
                <Sparkles className="w-4 h-4 text-primary" />
              </div>
              <div>
                <h3 className="text-xs font-bold text-foreground">BuildFlow AI</h3>
                <span className="text-[10px] text-muted-foreground font-medium flex items-center gap-1">
                  <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-ping" />
                  Site Knowledge Core
                </span>
              </div>
            </div>
            <button
              onClick={() => setIsOpen(false)}
              className="text-muted-foreground hover:text-foreground hover:bg-muted p-1 rounded-lg transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Messages Log */}
          <div className="flex-1 overflow-y-auto p-4 space-y-4">
            {messages.map((m, i) => (
              <div
                key={i}
                className={`flex ${m.sender === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                <div
                  className={`max-w-[85%] rounded-2xl px-4 py-2.5 text-xs leading-relaxed ${
                    m.sender === 'user'
                      ? 'bg-primary text-white rounded-br-none'
                      : 'bg-muted text-foreground border border-border/50 rounded-bl-none whitespace-pre-line'
                  }`}
                >
                  {m.text}
                </div>
              </div>
            ))}
            {isTyping && (
              <div className="flex justify-start">
                <div className="bg-muted text-foreground rounded-2xl rounded-bl-none px-4 py-2.5 text-xs flex items-center gap-1">
                  <span className="w-1.5 h-1.5 bg-muted-foreground/40 rounded-full animate-bounce" />
                  <span className="w-1.5 h-1.5 bg-muted-foreground/40 rounded-full animate-bounce [animation-delay:0.2s]" />
                  <span className="w-1.5 h-1.5 bg-muted-foreground/40 rounded-full animate-bounce [animation-delay:0.4s]" />
                </div>
              </div>
            )}
            <div ref={chatEndRef} />
          </div>

          {/* Suggested Prompts helper */}
          {messages.length === 1 && (
            <div className="px-4 py-2 bg-muted/20 border-t border-border/40 space-y-1.5">
              <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">Suggested Queries</p>
              <div className="flex flex-wrap gap-1.5">
                {suggestedQuestions.map(q => (
                  <button
                    key={q}
                    onClick={() => handleSend(q)}
                    className="text-[10px] bg-muted hover:bg-primary/10 hover:text-primary border border-border/60 text-foreground px-2 py-1 rounded-md transition-colors"
                  >
                    {q}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Input Footer */}
          <div className="p-3 border-t border-border flex items-center gap-2 bg-background">
            <input
              type="text"
              value={input}
              onChange={e => setInput(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && handleSend(input)}
              placeholder="Ask about cement, timelines, expenses..."
              className="flex-1 bg-muted text-xs border border-border/60 rounded-xl px-3.5 py-2 focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary transition-all text-foreground"
            />
            <button
              onClick={() => handleSend(input)}
              disabled={!input.trim()}
              className="bg-primary disabled:opacity-40 text-white p-2 rounded-xl hover:scale-105 active:scale-95 transition-all flex items-center justify-center shadow-lg"
            >
              <Send className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
