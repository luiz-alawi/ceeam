'use client';

import {
  X, MapPin, Calendar, Clock, Users, Package,
  CheckCircle, XCircle, AlertCircle, Trash2,
  MessageSquare, User, Mail, CalendarDays,
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
  // admin-only fields
  userName?: string;
  userEmail?: string;
  requestDate?: string;
}

interface BookingDetailModalProps {
  booking: BookingDetail;
  onClose: () => void;
  // user actions
  onCancel?: () => void;
  // admin actions
  onAccept?: () => void;
  onReject?: () => void;
  onAdminCancel?: () => void;
  onChat?: () => void;
}

const STATUS_CONFIG: Record<string, { label: string; icon: React.ReactNode; badge: string; bar: string }> = {
  pending: {
    label: 'Pendente',
    icon: <AlertCircle className="w-4 h-4 text-yellow-500" />,
    badge: 'bg-yellow-50 text-yellow-700 border-yellow-300',
    bar: 'bg-yellow-400',
  },
  accepted: {
    label: 'Aceito',
    icon: <CheckCircle className="w-4 h-4 text-green-600" />,
    badge: 'bg-green-50 text-green-700 border-green-300',
    bar: 'bg-green-500',
  },
  rejected: {
    label: 'Recusado',
    icon: <XCircle className="w-4 h-4 text-red-500" />,
    badge: 'bg-red-50 text-red-700 border-red-300',
    bar: 'bg-red-400',
  },
  cancelled: {
    label: 'Cancelado',
    icon: <XCircle className="w-4 h-4 text-gray-400" />,
    badge: 'bg-gray-100 text-gray-500 border-gray-300',
    bar: 'bg-gray-300',
  },
};

export default function BookingDetailModal({
  booking,
  onClose,
  onCancel,
  onAccept,
  onReject,
  onAdminCancel,
  onChat,
}: BookingDetailModalProps) {
  const cfg = STATUS_CONFIG[booking.status] ?? STATUS_CONFIG.pending;
  const isAdmin = !!(booking.userName || onAccept || onReject || onAdminCancel || onChat);

  const formattedDate = formatDatePtBR(booking.date, {
    weekday: 'long',
    day: '2-digit',
    month: 'long',
    year: 'numeric',
  });

  return (
    <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-2xl w-full max-w-sm shadow-2xl overflow-hidden">

        {/* Colour bar + header */}
        <div className={`h-1 w-full ${cfg.bar}`} />
        <div className="px-5 pt-4 pb-3 flex items-start justify-between gap-3">
          <div>
            <div className="flex items-center gap-2 mb-1">
              {cfg.icon}
              <span className={`px-2 py-0.5 rounded-full text-xs font-semibold border ${cfg.badge}`}>
                {cfg.label}
              </span>
            </div>
            <h2 className="text-lg font-bold text-gray-900 leading-tight">{booking.court}</h2>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 hover:bg-gray-100 rounded-lg transition-colors mt-0.5 shrink-0"
          >
            <X className="w-4 h-4 text-gray-500" />
          </button>
        </div>

        <div className="px-5 pb-5 space-y-4">

          {/* Date + time */}
          <div className="bg-gray-50 rounded-xl p-3 space-y-2">
            <div className="flex items-center gap-2.5 text-sm">
              <Calendar className="w-4 h-4 text-blue-500 shrink-0" />
              <span className="text-gray-800 capitalize font-medium">{formattedDate}</span>
            </div>
            <div className="flex items-center gap-2.5 text-sm">
              <Clock className="w-4 h-4 text-blue-500 shrink-0" />
              <span className="text-gray-800 font-medium">{booking.time}</span>
            </div>
          </div>

          {/* Requester info (admin view) */}
          {isAdmin && booking.userName && (
            <div className="bg-blue-50 rounded-xl p-3 space-y-1.5">
              <div className="flex items-center gap-2 text-sm">
                <User className="w-4 h-4 text-blue-500 shrink-0" />
                <span className="font-semibold text-gray-800">{booking.userName}</span>
              </div>
              {booking.userEmail && (
                <div className="flex items-center gap-2 text-xs text-gray-500">
                  <Mail className="w-3.5 h-3.5 text-blue-400 shrink-0" />
                  <span>{booking.userEmail}</span>
                </div>
              )}
              {booking.requestDate && (
                <div className="flex items-center gap-2 text-xs text-gray-400">
                  <CalendarDays className="w-3.5 h-3.5 shrink-0" />
                  <span>Solicitado em {formatDateTimePtBR(booking.requestDate)}</span>
                </div>
              )}
            </div>
          )}

          {/* Players */}
          {booking.players.length > 0 && (
            <div>
              <div className="flex items-center gap-1.5 text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">
                <Users className="w-3.5 h-3.5" /> Jogadores
              </div>
              <div className="flex flex-wrap gap-1.5">
                {booking.players.map((p) => (
                  <span
                    key={p}
                    className="px-2.5 py-1 bg-indigo-50 text-indigo-700 border border-indigo-200 rounded-full text-xs font-medium"
                  >
                    {p}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Equipment */}
          {booking.equipment.length > 0 && (
            <div>
              <div className="flex items-center gap-1.5 text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">
                <Package className="w-3.5 h-3.5" /> Equipamentos
              </div>
              <div className="flex flex-wrap gap-1.5">
                {booking.equipment.map((eq) => (
                  <span
                    key={eq}
                    className="px-2.5 py-1 bg-blue-50 text-blue-700 border border-blue-200 rounded-full text-xs font-medium"
                  >
                    {eq}
                  </span>
                ))}
              </div>
            </div>
          )}

          {booking.players.length === 0 && booking.equipment.length === 0 && (
            <p className="text-xs text-gray-400 text-center py-1">Sem equipamentos ou jogadores informados.</p>
          )}

          {/* Actions */}
          <div className="pt-1 space-y-2">
            {/* Admin: pending actions */}
            {onAccept && booking.status === 'pending' && (
              <div className="flex gap-2">
                <button
                  onClick={onAccept}
                  className="flex-1 flex items-center justify-center gap-1.5 py-2 bg-green-600 text-white rounded-lg text-sm font-medium hover:bg-green-700 transition-colors"
                >
                  <CheckCircle className="w-4 h-4" /> Aceitar
                </button>
                <button
                  onClick={onReject}
                  className="flex-1 flex items-center justify-center gap-1.5 py-2 bg-gray-600 text-white rounded-lg text-sm font-medium hover:bg-gray-700 transition-colors"
                >
                  <XCircle className="w-4 h-4" /> Recusar
                </button>
              </div>
            )}

            {/* Admin: cancel accepted */}
            {onAdminCancel && booking.status === 'accepted' && (
              <button
                onClick={onAdminCancel}
                className="w-full flex items-center justify-center gap-1.5 py-2 bg-red-600 text-white rounded-lg text-sm font-medium hover:bg-red-700 transition-colors"
              >
                <Trash2 className="w-4 h-4" /> Cancelar reserva
              </button>
            )}

            {/* Admin: chat (any non-cancelled/rejected status) */}
            {onChat && (booking.status === 'pending' || booking.status === 'accepted') && (
              <button
                onClick={onChat}
                className="w-full flex items-center justify-center gap-1.5 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 transition-colors"
              >
                <MessageSquare className="w-4 h-4" /> Chat com usuário
              </button>
            )}

            {/* User: cancel */}
            {onCancel && (booking.status === 'pending' || booking.status === 'accepted') && (
              <button
                onClick={onCancel}
                className="w-full flex items-center justify-center gap-1.5 py-2 bg-red-600 text-white rounded-lg text-sm font-medium hover:bg-red-700 transition-colors"
              >
                <Trash2 className="w-4 h-4" /> Cancelar agendamento
              </button>
            )}

            <button
              onClick={onClose}
              className="w-full py-2 border border-gray-200 text-gray-600 rounded-lg text-sm font-medium hover:bg-gray-50 transition-colors"
            >
              Fechar
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
