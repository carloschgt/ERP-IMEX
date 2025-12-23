
import React, { useState, useRef, useEffect } from 'react';
import { GoogleGenAI } from "@google/genai";
import { ImportRecord } from '../types';
import { COLORS, ICONS } from '../constants';

interface AIAssistantProps {
  records: ImportRecord[];
}

interface Message {
  role: 'user' | 'assistant';
  content: string;
}

const AIAssistant: React.FC<AIAssistantProps> = ({ records }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [input, setInput] = useState('');
  const [messages, setMessages] = useState<Message[]>([
    { role: 'assistant', content: 'Olá! Sou o assistente operacional IMEX. Como posso ajudar hoje?' }
  ]);
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleSend = async () => {
    if (!input.trim() || isLoading) return;
    const userMessage = input.trim();
    setInput('');
    setMessages(prev => [...prev, { role: 'user', content: userMessage }]);
    setIsLoading(true);

    try {
      const apiKey = (import.meta as any).env?.VITE_GEMINI_API_KEY || (import.meta as any).env?.GEMINI_API_KEY;
      if (!apiKey || apiKey === 'PLACEHOLDER_API_KEY') {
        throw new Error('Chave Gemini não configurada. Defina VITE_GEMINI_API_KEY no .env.local');
      }
      const ai = new GoogleGenAI({ apiKey });
      const response = await ai.models.generateContent({
        model: 'gemini-3-flash-preview',
        contents: userMessage,
        config: {
          systemInstruction: `Você é o Assistente Estratégico da IMEX Solutions. Contexto: ${JSON.stringify(records.slice(0, 10))}. Use linguagem profissional e direta.`,
          temperature: 0.1,
        },
      });
      setMessages(prev => [...prev, { role: 'assistant', content: response.text || 'Erro no processamento.' }]);
    } catch (e) {
      setMessages(prev => [...prev, { role: 'assistant', content: 'Erro de conexão.' }]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed bottom-4 right-4 lg:bottom-6 lg:right-6 z-[100] flex flex-col items-end">
      {isOpen && (
        <div className="w-[calc(100vw-2rem)] sm:w-[400px] lg:w-[450px] h-[70vh] lg:h-[600px] bg-slate-900 rounded-2xl lg:rounded-[2.5rem] shadow-2xl border border-slate-800 flex flex-col overflow-hidden mb-4 animate-in slide-in-from-bottom-4 duration-300">
          <div className="p-4 lg:p-6 bg-slate-800/50 border-b border-slate-800 flex justify-between items-center">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 lg:w-10 lg:h-10 rounded-xl bg-[#04816E] flex items-center justify-center text-white">
                {ICONS.Bot}
              </div>
              <div>
                <h4 className="text-white font-black text-[10px] lg:text-xs uppercase tracking-widest">IA Smart</h4>
              </div>
            </div>
            <button onClick={() => setIsOpen(false)} className="text-slate-500 hover:text-white">
              {ICONS.Close}
            </button>
          </div>

          <div className="flex-1 overflow-y-auto p-4 lg:p-6 space-y-4 custom-scrollbar bg-slate-900/50">
            {messages.map((msg, i) => (
              <div key={i} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                <div className={`max-w-[90%] p-4 rounded-xl text-[10px] lg:text-[11px] leading-relaxed whitespace-pre-wrap ${
                  msg.role === 'user' ? 'bg-[#04816E] text-white rounded-br-none' : 'bg-slate-800 text-slate-200 rounded-bl-none border border-slate-700'
                }`}>
                  {msg.content}
                </div>
              </div>
            ))}
            <div ref={messagesEndRef} />
          </div>

          <div className="p-4 lg:p-6 bg-slate-800/30 border-t border-slate-800">
            <div className="relative">
              <input 
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleSend()}
                placeholder="Perguntar..."
                className="w-full bg-slate-950 border border-slate-700 text-white text-[10px] lg:text-xs px-4 py-3 rounded-xl pr-12 focus:ring-1 focus:ring-[#04816E] outline-none"
              />
              <button onClick={handleSend} disabled={isLoading} className="absolute right-2 top-2 p-1.5 text-[#04816E] hover:text-emerald-400">
                {ICONS.Send}
              </button>
            </div>
          </div>
        </div>
      )}

      <button 
        onClick={() => setIsOpen(!isOpen)}
        className="w-12 h-12 lg:w-14 lg:h-14 rounded-xl lg:rounded-2xl bg-[#04816E] text-white shadow-2xl flex items-center justify-center hover:scale-110 active:scale-95 transition-all group"
      >
        {isOpen ? ICONS.Close : ICONS.Sparkles}
      </button>
    </div>
  );
};

export default AIAssistant;
