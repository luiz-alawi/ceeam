'use client';

import { useState, useEffect, useRef } from 'react';
import { X, Send, User, Loader2 } from 'lucide-react';
import { getMessages, sendMessage } from '@/actions/messages';
import type { Message } from '@/types';

interface ChatModalProps {
  userName: string;
  userEmail: string;
  onClose: () => void;
  senderRole?: 'admin' | 'user';
}

const POLL_INTERVAL = 3000;

export default function ChatModal({ userName, userEmail, onClose, senderRole = 'admin' }: ChatModalProps) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);
  const lastIdRef = useRef<string | null>(null);

  // Fetch inicial + polling a cada 3 s
  useEffect(() => {
    let active = true;

    const fetchMessages = async () => {
      try {
        const fresh = await getMessages(userEmail);
        if (!active) return;
        // Só atualiza se chegou mensagem nova (evita re-render desnecessário)
        const freshLastId = fresh.at(-1)?.id ?? null;
        if (freshLastId !== lastIdRef.current) {
          lastIdRef.current = freshLastId;
          setMessages(fresh);
        }
      } catch {
        /* silencioso */
      }
    };

    setLoading(true);
    fetchMessages().finally(() => { if (active) setLoading(false); });

    const interval = setInterval(fetchMessages, POLL_INTERVAL);
    return () => { active = false; clearInterval(interval); };
  }, [userEmail]);

  // Rola para a última mensagem
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessage.trim() || sending) return;

    setSending(true);
    const text = newMessage.trim();
    setNewMessage('');
    try {
      const msg = await sendMessage({ text, sender: senderRole, userEmail });
      setMessages((prev) => {
        lastIdRef.current = msg.id;
        return [...prev, msg];
      });
    } catch {
      setNewMessage(text); // devolve o texto se falhou
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/30 backdrop-blur-sm flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-xl max-w-2xl w-full h-[600px] flex flex-col">
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
              <User className="w-5 h-5 text-blue-600" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-gray-900">{userName}</h2>
              <p className="text-sm text-gray-600">{userEmail}</p>
            </div>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-lg transition-colors">
            <X className="w-5 h-5 text-gray-600" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-6 space-y-4">
          {loading ? (
            <div className="flex items-center justify-center h-full text-gray-400">
              <Loader2 className="w-5 h-5 animate-spin mr-2" />
              <span className="text-sm">Carregando conversa...</span>
            </div>
          ) : messages.length === 0 ? (
            <div className="flex items-center justify-center h-full text-gray-400">
              <p className="text-sm">Nenhuma mensagem ainda. Inicie a conversa!</p>
            </div>
          ) : (
            messages.map((message) => (
              <div
                key={message.id}
                className={`flex ${message.sender === senderRole ? 'justify-end' : 'justify-start'}`}
              >
                <div
                  className={`max-w-[70%] rounded-lg p-4 ${
                    message.sender === senderRole
                      ? 'bg-blue-600 text-white'
                      : 'bg-gray-100 text-gray-900'
                  }`}
                >
                  <p className="text-sm">{message.text}</p>
                  <p className={`text-xs mt-2 ${message.sender === senderRole ? 'text-blue-100' : 'text-gray-500'}`}>
                    {message.timestamp.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
                  </p>
                </div>
              </div>
            ))
          )}
          <div ref={bottomRef} />
        </div>

        <form onSubmit={handleSend} className="p-6 border-t border-gray-200">
          <div className="flex gap-3">
            <input
              type="text"
              value={newMessage}
              onChange={(e) => setNewMessage(e.target.value)}
              placeholder="Digite sua mensagem..."
              disabled={sending}
              className="flex-1 px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:opacity-50"
            />
            <button
              type="submit"
              disabled={sending || !newMessage.trim()}
              className="px-6 py-3 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition-colors flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {sending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
              Enviar
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
