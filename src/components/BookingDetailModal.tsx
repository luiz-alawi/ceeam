'use client';

import {
  X, Calendar, Clock, Users, Package, CheckCircle, XCircle, AlertCircle,
  Trash2, MessageSquare, User, Mail, CalendarDays, RotateCcw, Repeat, MessageSquareText, History,
} from 'lucide-react';
import { formatDatePtBR, formatDateTimePtBR } from '@/utils/dateUtils';

export interface BookingDetail {
  id: string;
  court: string;
  date: string;
  time: string;
  players: string[];
  equipment: string[];
  status: string;
  userName?: string;
  userEmail?: string;
  requestDate?: string;
  recurringGroupId?: string | null;
  reason?: string | null;
}

interface BookingDetailModalProps {
  booking: BookingDetail;
  onClose: () => void;
  onCancel?: () => void;
  onAccept?: () => void;
  onReject?: () => void;
  onAdminCancel?: () => void;
  onRestore?: () => void;
  onChat?: () => void;
  onHistory?: () => void;
}

const STATUS_CONFIG: Record<string, { label: string; icon: React.ReactNode; chip: string; bar: string }> = {
  pending:   { label: 'Pendente',  icon: <AlertCircle className="w-4 h-4" style={{ color: '#d97706' }} />, chip: 'bg-[#fdf2e3] text-[#b45309]', bar: '#d97706' },
  accepted:  { label: 'Confirmado',icon: <CheckCircle className="w-4 h-4" style={{ color: '#1f7a44' }} />, chip: 'bg-[#e7f6ec] text-[#1f7a44]', bar: '#1f7a44' },
  waitlisted:{ label: 'Lista de espera', icon: <AlertCircle className="w-4 h-4" style={{ color: '#6d28d9' }} />, chip: 'bg-[#ede9fe] text-[#6d28d9]', bar: '#6d28d9' },
  rejected:  { label: 'Recusado',  icon: <XCircle className="w-4 h-4" style={{ color: '#dc2626' }} />,     chip: 'bg-[#fdecec] text-[#b91c1c]', bar: '#dc2626' },
  cancelled: { label: 'Cancelado', icon: <XCircle className="w-4 h-4" style={{ color: '#5b6b80' }} />,     chip: 'bg-[#eef2f7] text-[#5b6b80]', bar: '#94a3b8' },
};

export default function BookingDetailModal({
  booking, onClose, onCancel, onAccept, onReject, onAdminCancel, onRestore, onChat, onHistory,
}: BookingDetailModalProps) {
  const cfg = STATUS_CONFIG[booking.status] ?? STATUS_CONFIG.pending;
  const isAdmin = !!(booking.userName || onAccept || onReject || onAdminCancel || onRestore || onChat);
  const formattedDate = formatDatePtBR(booking.date, { weekday: 'long', day: '2-digit', month: 'long', year: 'numeric' });

  const btn = () =>
    `w-full flex items-center justify-center gap-1.5 py-2.5 text-white rounded-xl text-[14px] font-semibold transition-colors `;

  return (
    <div className="fixed inset-0 bg-[var(--ink)]/55 backdrop-blur-sm flex items-end sm:items-center justify-center sm:p-4 z-50">
      <div className="anim-pop bg-white sm:rounded-3xl rounded-t-3xl w-full max-w-sm shadow-2xl overflow-hidden">
        <div className="h-1.5 w-full" style={{ background: cfg.bar }} />

        <div className="px-5 pt-4 pb-3 flex items-start justify-between gap-3">
          <div>
            <div className="flex items-center gap-2 mb-1 flex-wrap">
              {cfg.icon}
              <span className={`px-2 py-0.5 rounded-full text-[11px] font-bold uppercase tracking-wide ${cfg.chip}`}>{cfg.label}</span>
              {booking.recurringGroupId && (
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-bold uppercase tracking-wide bg-[#ede9fe] text-[#6d28d9]">
                  <Repeat className="w-3 h-3" /> Recorrente
                </span>
              )}
            </div>
            <h2 className="font-display text-[22px] font-bold text-[var(--ink)] leading-tight">{booking.court}</h2>
          </div>
          <button onClick={onClose} className="p-1.5 hover:bg-[var(--paper)] rounded-full transition-colors mt-0.5 shrink-0">
            <X className="w-4 h-4 text-[var(--muted)]" />
          </button>
        </div>

        <div className="px-5 pb-5 space-y-4">
          <div className="space-y-2">
            <div className="flex items-center gap-3 text-[14px]">
              <Calendar className="w-4 h-4 text-[var(--muted)] shrink-0" /><span className="capitalize">{formattedDate}</span>
            </div>
            <div className="flex items-center gap-3 text-[14px]">
              <Clock className="w-4 h-4 text-[var(--muted)] shrink-0" /><span>{booking.time}</span>
            </div>
          </div>

          {booking.reason && (
            <div className="bg-[#f5f3ff] border border-[#ddd6fe] rounded-2xl p-3">
              <div className="flex items-center gap-1.5 text-[11px] font-bold text-[#6d28d9] uppercase tracking-wide mb-1">
                <MessageSquareText className="w-3.5 h-3.5" /> Justificativa do horário fixo
              </div>
              <p className="text-[13px] text-[var(--ink)] leading-snug">{booking.reason}</p>
            </div>
          )}

          {isAdmin && booking.userName && (
            <div className="bg-[var(--paper)] rounded-2xl p-3 space-y-1.5">
              <div className="flex items-center gap-2 text-[14px]">
                <User className="w-4 h-4 text-[var(--muted)] shrink-0" /><span className="font-semibold">{booking.userName}</span>
              </div>
              {booking.userEmail && (
                <div className="flex items-center gap-2 text-[12px] text-[var(--muted)]"><Mail className="w-3.5 h-3.5 shrink-0" /> {booking.userEmail}</div>
              )}
              {booking.requestDate && (
                <div className="flex items-center gap-2 text-[12px] text-[var(--muted)]"><CalendarDays className="w-3.5 h-3.5 shrink-0" /> Solicitado em {formatDateTimePtBR(booking.requestDate)}</div>
              )}
            </div>
          )}

          {booking.players.length > 0 && (
            <div>
              <div className="flex items-center gap-1.5 text-[11px] font-bold text-[var(--muted)] uppercase tracking-wide mb-2"><Users className="w-3.5 h-3.5" /> Jogadores</div>
              <div className="flex flex-wrap gap-1.5">
                {booking.players.map((p) => <span key={p} className="px-2.5 py-1 bg-[var(--brand-tint)] text-[var(--brand-700)] rounded-full text-[12px] font-semibold">{p}</span>)}
              </div>
            </div>
          )}

          {booking.equipment.length > 0 && (
            <div>
              <div className="flex items-center gap-1.5 text-[11px] font-bold text-[var(--muted)] uppercase tracking-wide mb-2"><Package className="w-3.5 h-3.5" /> Equipamentos</div>
              <div className="flex flex-wrap gap-1.5">
                {booking.equipment.map((eq) => <span key={eq} className="px-2.5 py-1 bg-[var(--paper)] text-[var(--ink)] rounded-full text-[12px] font-semibold">{eq}</span>)}
              </div>
            </div>
          )}

          {booking.players.length === 0 && booking.equipment.length === 0 && (
            <p className="text-[12px] text-[var(--muted)] text-center py-1">Sem equipamentos ou jogadores informados.</p>
          )}

          <div className="pt-1 space-y-2">
            {onAccept && (booking.status === 'pending' || booking.status === 'waitlisted') && (
              <div className="flex gap-2">
                <button onClick={onAccept} className={`${btn()}bg-[#1f7a44] hover:bg-[#196437]`}><CheckCircle className="w-4 h-4" /> Aceitar</button>
                <button onClick={onReject} className="flex-1 flex items-center justify-center gap-1.5 py-2.5 border border-[var(--line)] text-[var(--ink)] rounded-xl text-[14px] font-semibold hover:bg-[var(--paper)] transition-colors"><XCircle className="w-4 h-4" /> Recusar</button>
              </div>
            )}
            {onAdminCancel && booking.status === 'accepted' && (
              <button onClick={onAdminCancel} className={`${btn()}bg-[#dc2626] hover:bg-[#b91c1c]`}><Trash2 className="w-4 h-4" /> Cancelar reserva</button>
            )}
            {onChat && (booking.status === 'pending' || booking.status === 'accepted') && (
              <button onClick={onChat} className={`${btn()}bg-[var(--brand)] hover:bg-[var(--brand-700)]`}><MessageSquare className="w-4 h-4" /> Conversar com usuário</button>
            )}
            {onRestore && (booking.status === 'rejected' || booking.status === 'cancelled') && (
              <button onClick={onRestore} className={`${btn()}bg-[#1f7a44] hover:bg-[#196437]`}><RotateCcw className="w-4 h-4" /> Aceitar pedido</button>
            )}
            {onCancel && (booking.status === 'pending' || booking.status === 'accepted' || booking.status === 'waitlisted') && (
              <button onClick={onCancel} className={`${btn()}bg-[#dc2626] hover:bg-[#b91c1c]`}><Trash2 className="w-4 h-4" /> {booking.status === 'waitlisted' ? 'Sair da lista de espera' : 'Cancelar agendamento'}</button>
            )}
            {onHistory && (
              <button onClick={onHistory} className="w-full flex items-center justify-center gap-1.5 py-2.5 border border-[var(--line)] text-[var(--ink)] rounded-xl text-[14px] font-semibold hover:bg-[var(--paper)] transition-colors"><History className="w-4 h-4" /> Ver histórico do usuário</button>
            )}
            <button onClick={onClose} className="w-full py-2.5 text-[14px] font-semibold text-[var(--muted)] rounded-xl hover:bg-[var(--paper)] transition-colors">Fechar</button>
          </div>
        </div>
      </div>
    </div>
  );
}
