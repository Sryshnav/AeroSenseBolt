import { useState, useRef, useEffect } from 'react';
import { Send, Mic, MicOff, Volume2 } from 'lucide-react';
import { SpeechService } from '../services/speechService';

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
}

interface ChatInterfaceProps {
  onSendMessage: (message: string) => Promise<void>;
  messages: Message[];
  isProcessing: boolean;
}

export default function ChatInterface({ onSendMessage, messages, isProcessing }: ChatInterfaceProps) {
  const [input, setInput] = useState('');
  const [isListening, setIsListening] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const speechServiceRef = useRef<SpeechService | null>(null);

  useEffect(() => {
    speechServiceRef.current = new SpeechService();
  }, []);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSend = async () => {
    if (!input.trim() || isProcessing) return;

    const message = input.trim();
    setInput('');
    await onSendMessage(message);
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const toggleListening = () => {
    const speechService = speechServiceRef.current;
    if (!speechService) return;

    if (isListening) {
      speechService.stopListening();
      setIsListening(false);
    } else {
      setIsListening(true);
      speechService.startListening(
        (transcript) => {
          setInput(transcript);
          setIsListening(false);
        },
        (error) => {
          console.error('Speech recognition error:', error);
          setIsListening(false);
        }
      );
    }
  };

  const formatTime = (date: Date) => {
    return date.toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  return (
    <div className="flex flex-col h-full bg-slate-800 rounded-lg">
      <div className="p-4 border-b border-slate-700">
        <h2 className="text-white font-semibold flex items-center gap-2">
          <Volume2 className="w-5 h-5 text-blue-400" />
          Chat with Guardian
        </h2>
        <p className="text-sm text-gray-400 mt-1">Ask about air quality, forecasts, or health advice</p>
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.length === 0 && (
          <div className="text-center text-gray-500 mt-8">
            <p className="mb-4">Start a conversation with your air quality guardian</p>
            <div className="space-y-2 text-sm">
              <p className="text-gray-600">Try asking:</p>
              <div className="space-y-1">
                <p className="text-gray-500">"How's the air quality today?"</p>
                <p className="text-gray-500">"Can my kids play outside?"</p>
                <p className="text-gray-500">"When will conditions improve?"</p>
              </div>
            </div>
          </div>
        )}

        {messages.map((message) => (
          <div
            key={message.id}
            className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
          >
            <div
              className={`max-w-[80%] rounded-lg p-3 ${
                message.role === 'user'
                  ? 'bg-blue-600 text-white'
                  : 'bg-slate-700 text-gray-100'
              }`}
            >
              <p className="text-sm">{message.content}</p>
              <p className="text-xs opacity-60 mt-1">{formatTime(message.timestamp)}</p>
            </div>
          </div>
        ))}

        {isProcessing && (
          <div className="flex justify-start">
            <div className="bg-slate-700 text-gray-100 rounded-lg p-3">
              <div className="flex items-center gap-2">
                <div className="flex gap-1">
                  <div className="w-2 h-2 bg-blue-400 rounded-full animate-bounce"></div>
                  <div className="w-2 h-2 bg-blue-400 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                  <div className="w-2 h-2 bg-blue-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                </div>
                <span className="text-sm text-gray-400">Analyzing...</span>
              </div>
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      <div className="p-4 border-t border-slate-700">
        <div className="flex items-end gap-2">
          <button
            onClick={toggleListening}
            disabled={isProcessing}
            className={`p-3 rounded-lg transition-colors ${
              isListening
                ? 'bg-red-600 hover:bg-red-700 text-white animate-pulse'
                : 'bg-slate-700 hover:bg-slate-600 text-gray-300'
            } disabled:opacity-50 disabled:cursor-not-allowed`}
          >
            {isListening ? <MicOff className="w-5 h-5" /> : <Mic className="w-5 h-5" />}
          </button>

          <div className="flex-1">
            <textarea
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder="Type your question or use voice..."
              disabled={isProcessing || isListening}
              className="w-full bg-slate-700 text-white rounded-lg px-4 py-3 resize-none focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50"
              rows={1}
            />
          </div>

          <button
            onClick={handleSend}
            disabled={!input.trim() || isProcessing || isListening}
            className="p-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Send className="w-5 h-5" />
          </button>
        </div>

        {isListening && (
          <p className="text-sm text-blue-400 mt-2 flex items-center gap-2">
            <span className="animate-pulse">●</span>
            Listening... Speak now
          </p>
        )}
      </div>
    </div>
  );
}

export type { Message };
