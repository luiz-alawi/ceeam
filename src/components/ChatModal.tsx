'use client';

import { useState, useEffect, useRef } from 'react';
import { X, Send, Loader2 } from 'lucide-react';
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

  useEffect(() => {
    let active = true;
    const fetchMessages = async () => {
      try {
        const fresh = await getMessages(userEmail);
        if (!active) return;
        const freshLastId = fresh.at(-1)?.id ?? null;
        if (freshLastId !== lastIdRef.current) { lastIdRef.current = freshLastId; setMessages(fresh); }
      } catch { /* silencioso */ }
    };
    setLoading(true);
    fetchMessages().finally(() => { if (active) setLoading(false); });
    const interval = setInterval(fetchMessages, POLL_INTERVAL);
    return () => { active = false; clearInterval(interval); };
  }, [userEmail]);

  useEffect(() => { bottomRef.current?.scrollIntoView({ behavior: 'smooth' }); }, [messages]);

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessage.trim() || sending) return;
    setSending(true);
    const text = newMessage.trim();
    setNewMessage('');
    try {
      const msg = await sendMessage({ text, sender: senderRole, userEmail });
      setMessages((prev) => { lastIdRef.current = msg.id; return [...prev, msg]; });
    } catch { setNewMessage(text); }
    finally { setSending(false); }
  };

  return (
    <div className="fixed inset-0 bg-[var(--ink)]/55 backdrop-blur-sm flex items-end sm:items-center justify-center sm:p-4 z-50">
      <div className="anim-pop bg-white w-full sm:max-w-md sm:rounded-3xl rounded-t-3xl h-[80vh] sm:h-[560px] flex flex-col shadow-2xl overflow-hidden">
        <div className="flex items-center gap-3 px-4 py-3 bg-[var(--ink)] text-white">
          <div className="w-9 h-9 rounded-full bg-[var(--brand)] flex items-center justify-center font-semibold text-[15px]">
            {(userName[0] ?? '?').toUpperCase()}
          </div>
          <div className="min-w-0 flex-1">
            <h2 className="font-display text-[15px] font-semibold leading-tight truncate">{userName}</h2>
            <p className="text-[12px] text-white/55 truncate">{userEmail}</p>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-white/10 rounded-full transition-colors"><X className="w-5 h-5" /></button>
        </div>

        <div className="flex-1 overflow-y-auto nice-scroll p-4 space-y-3 bg-[var(--paper)]">
          {loading ? (
            <div className="flex items-center justify-center h-full text-[var(--muted)]"><Loader2 className="w-5 h-5 animate-spin mr-2" /><span className="text-[13px]">Carregando conversa…</span></div>
          ) : messages.length === 0 ? (
            <div className="flex items-center justify-center h-full text-[var(--muted)] text-center px-6"><p className="text-[13px]">Nenhuma mensagem ainda. Inicie a conversa!</p></div>
          ) : (
            messages.map((message) => {
              const mine = message.sender === senderRole;
              return (
                <div key={message.id} className={`flex ${mine ? 'justify-end' : 'justify-start'}`}>
                  <div className={`max-w-[78%] rounded-2xl px-3.5 py-2 ${mine ? 'bg-[var(--brand)] text-white rounded-br-md' : 'bg-white text-[var(--ink)] border border-[var(--line)] rounded-bl-md'}`}>
                    <p className="text-[14px] whitespace-pre-wrap break-words">{message.text}</p>
                    <p className={`text-[10px] mt-1 ${mine ? 'text-white/70' : 'text-[var(--muted)]'}`}>
                      {message.timestamp.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
                    </p>
                  </div>
                </div>
              );
            })
          )}
          <div ref={bottomRef} />
        </div>

        <form onSubmit={handleSend} className="p-3 border-t border-[var(--line)] flex gap-2 bg-white">
          <input type="text" value={newMessage} onChange={(e) => setNewMessage(e.target.value)} placeholder="Digite sua mensagem…" disabled={sending}
            className="flex-1 px-4 py-2.5 bg-[var(--paper)] rounded-full text-[14px] text-[var(--ink)] focus:outline-none focus:ring-2 focus:ring-[var(--brand)]/30 disabled:opacity-50" />
          <button type="submit" disabled={sending || !newMessage.trim()}
            className="w-11 h-11 shrink-0 bg-[var(--brand)] text-white rounded-full hover:bg-[var(--brand-700)] transition-colors grid place-items-center disabled:opacity-50">
            {sending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
          </button>
        </form>
      </div>
    </div>
  );
}
