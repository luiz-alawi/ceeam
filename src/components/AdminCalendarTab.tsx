'use client';

import { useState } from 'react';
import Calendar from '@/components/Calendar';
import { User, Clock, Package, CalendarDays, ChevronDown, ChevronUp, CheckCircle, XCircle, AlertCircle, Users } from 'lucide-react';
import { formatDatePtBR } from '@/utils/dateUtils';
import type { CalendarEntry, GymClosure, WeeklyEvent, Request } from '@/types';

interface AdminCalendarTabProps {
  calendarBookings: CalendarEntry[];
  closures: GymClosure[];
  weeklyEvents: WeeklyEvent[];
  requests: Request[];
}

function toYMD(d: Date) {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

const STATUS_ICON = {
  accepted:  <CheckCircle className="w-3.5 h-3.5 text-green-600" />,
  rejected:  <XCircle    className="w-3.5 h-3.5 text-red-500"   />,
  cancelled: <XCircle    className="w-3.5 h-3.5 text-gray-400"  />,
  pending:   <AlertCircle className="w-3.5 h-3.5 text-yellow-500" />,
};

const STATUS_BADGE: Record<string, string> = {
  accepted:  'bg-green-50  text-green-700  border-green-200',
  rejected:  'bg-red-50    text-red-700    border-red-200',
  cancelled: 'bg-gray-50   text-gray-600   border-gray-200',
  pending:   'bg-yellow-50 text-yellow-700 border-yellow-200',
};

const STATUS_LABEL: Record<string, string> = {
  accepted: 'Aceito', rejected: 'Recusado', cancelled: 'Cancelado', pending: 'Pendente',
};

export default function AdminCalendarTab({
  calendarBookings, closures, weeklyEvents, requests,
}: AdminCalendarTabProps) {
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [expandedId, setExpandedId]     = useState<string | null>(null);

  const dayRequests = selectedDate
    ? [...requests]
        .filter((r) => r.date === toYMD(selectedDate))
        .sort((a, b) => a.time.localeCompare(b.time))
    : [];

  return (
    <div className="grid lg:grid-cols-5 gap-5">
      {/* Calendar */}
      <div className="lg:col-span-3 bg-white rounded-xl shadow-sm border border-gray-200 p-4">
        <Calendar
          bookings={calendarBookings}
          closures={closures}
          weeklyEvents={weeklyEvents}
          onDateClick={setSelectedDate}
          selectedDate={selectedDate}
        />
      </div>

      {/* Day detail panel */}
      <div className="lg:col-span-2">
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4 sticky top-4">
          {!selectedDate ? (
            <div className="flex flex-col items-center justify-center py-12 text-gray-400">
              <CalendarDays className="w-10 h-10 mb-3 text-gray-200" />
              <p className="text-xs text-center text-gray-400">
                Selecione um dia no calendário para ver os agendamentos
              </p>
            </div>
          ) : (
            <>
              <h3 className="text-sm font-bold text-gray-900 mb-1 capitalize">
                {selectedDate.toLocaleDateString('pt-BR', { weekday: 'long', day: '2-digit', month: 'long', year: 'numeric' })}
              </h3>
              <p className="text-xs text-gray-400 mb-3">
                {dayRequests.length === 0
                  ? 'Nenhum agendamento'
                  : `${dayRequests.length} agendamento${dayRequests.length > 1 ? 's' : ''}`}
              </p>

              {dayRequests.length === 0 ? (
                <p className="text-xs text-gray-400 py-4 text-center">Dia livre.</p>
              ) : (
                <div className="space-y-2 max-h-[60vh] overflow-y-auto pr-0.5">
                  {dayRequests.map((req) => {
                    const isExpanded = expandedId === req.id;
                    const icon  = STATUS_ICON[req.status as keyof typeof STATUS_ICON]  ?? STATUS_ICON.pending;
                    const badge = STATUS_BADGE[req.status] ?? STATUS_BADGE.pending;
                    const label = STATUS_LABEL[req.status] ?? req.status;

                    return (
                      <div key={req.id} className="border border-gray-200 rounded-lg overflow-hidden">
                        {/* Header row */}
                        <button
                          onClick={() => setExpandedId(isExpanded ? null : req.id)}
                          className="w-full text-left p-3 hover:bg-gray-50 transition-colors"
                        >
                          <div className="flex items-center justify-between gap-2">
                            <div className="flex items-center gap-2 min-w-0">
                              {icon}
                              <span className="text-xs font-semibold text-gray-900 shrink-0">{req.time}</span>
                              <span className="text-xs text-gray-400 shrink-0">· {req.court}</span>
                            </div>
                            <div className="flex items-center gap-1.5 shrink-0">
                              <span className={`px-1.5 py-0.5 rounded-full text-[10px] font-medium border ${badge}`}>
                                {label}
                              </span>
                              {isExpanded
                                ? <ChevronUp   className="w-3 h-3 text-gray-400" />
                                : <ChevronDown className="w-3 h-3 text-gray-400" />}
                            </div>
                          </div>
                          <div className="text-xs text-gray-500 mt-0.5 ml-5 truncate">{req.userName}</div>
                        </button>

                        {/* Expanded detail */}
                        {isExpanded && (
                          <div className="px-3 pb-3 pt-2 border-t border-gray-100 bg-gray-50 space-y-2">
                            <div className="flex items-start gap-2 text-xs">
                              <User className="w-3.5 h-3.5 text-gray-400 mt-0.5 shrink-0" />
                              <div>
                                <span className="font-medium text-gray-800">{req.userName}</span>
                                <span className="text-gray-400 ml-1 block">{req.userEmail}</span>
                              </div>
                            </div>
                            <div className="flex items-center gap-2 text-xs text-gray-600">
                              <Clock className="w-3.5 h-3.5 text-gray-400 shrink-0" />
                              {req.time} · {req.court}
                            </div>
                            {req.players.length > 0 && (
                              <div className="flex items-start gap-2 text-xs">
                                <Users className="w-3.5 h-3.5 text-gray-400 mt-0.5 shrink-0" />
                                <div className="flex flex-wrap gap-1">
                                  {req.players.map((p) => (
                                    <span key={p} className="px-1.5 py-0.5 bg-blue-50 text-blue-700 rounded text-[10px]">
                                      {p}
                                    </span>
                                  ))}
                                </div>
                              </div>
                            )}
                            {req.equipment.length > 0 && (
                              <div className="flex items-start gap-2 text-xs">
                                <Package className="w-3.5 h-3.5 text-gray-400 mt-0.5 shrink-0" />
                                <div className="flex flex-wrap gap-1">
                                  {req.equipment.map((eq) => (
                                    <span key={eq} className="px-1.5 py-0.5 bg-blue-50 text-blue-700 rounded text-[10px]">
                                      {eq}
                                    </span>
                                  ))}
                                </div>
                              </div>
                            )}
                            <div className="text-[10px] text-gray-400">
                              Solicitado em {formatDatePtBR(req.requestDate.split('T')[0], { day: '2-digit', month: 'short', year: 'numeric' })}
                            </div>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}
