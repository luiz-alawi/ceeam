'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/auth-context';
import { LogOut, Calendar as CalendarIcon, Plus, Clock, CheckCircle, XCircle, AlertCircle, Loader2, MessageCircle } from 'lucide-react';
import Calendar from '@/components/Calendar';
import BookingModal from '@/components/BookingModal';
import BookingDetailModal from '@/components/BookingDetailModal';
import ChatModal from '@/components/ChatModal';
import { getBookings, createBooking, cancelBooking } from '@/actions/bookings';
import { getCalendarData } from '@/actions/calendar';
import { formatDatePtBR } from '@/utils/dateUtils';
import type { Booking, CalendarEntry, GymClosure, WeeklyEvent } from '@/types';

export default function DashboardPage() {
  const router = useRouter();
  const { isAuthenticated, currentUser, logout } = useAuth();

  const [bookings, setBookings] = useState<Booking[]>([]);
  const [calendarBookings, setCalendarBookings] = useState<CalendarEntry[]>([]);
  const [closures, setClosures] = useState<GymClosure[]>([]);
  const [weeklyEvents, setWeeklyEvents] = useState<WeeklyEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showBookingModal, setShowBookingModal] = useState(false);
  const [bookingInitialDate, setBookingInitialDate] = useState<string | undefined>();
  const [showChat, setShowChat] = useState(false);
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [detailBooking, setDetailBooking] = useState<Booking | null>(null);

  useEffect(() => {
    if (!isAuthenticated) { router.replace('/login'); return; }
  }, [isAuthenticated, router]);

  useEffect(() => {
    if (!currentUser) return;
    setLoading(true);
    setError(null);
    Promise.all([
      getBookings(currentUser),
      getCalendarData(),
    ])
      .then(([userBookings, calData]) => {
        setBookings(userBookings);
        setCalendarBookings(calData.bookings);
        setClosures(calData.closures);
        setWeeklyEvents(calData.weeklyEvents);
      })
      .catch(() => setError('Falha ao carregar dados'))
      .finally(() => setLoading(false));
  }, [currentUser]);

  if (!isAuthenticated) return null;

  const handleLogout = () => { logout(); };

  const toYMD = (d: Date) =>
    `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;

  const handleDateDoubleClick = (date: Date) => {
    setSelectedDate(date);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    setBookingInitialDate(date >= today ? toYMD(date) : undefined);
    setShowBookingModal(true);
  };

  const handleNewBooking = async (data: { date: string; time: string; court: string; equipment: string[]; players: string[] }) => {
    const booking = await createBooking({ ...data, userEmail: currentUser, userName: currentUser });
    setBookings((prev) => [booking, ...prev]);
    setShowBookingModal(false);
  };

  const handleCancelBooking = async (id: string) => {
    setBookings((prev) => prev.map((b) => (b.id === id ? { ...b, status: 'cancelled' as const } : b)));
    try {
      await cancelBooking(id);
    } catch {
      getBookings(currentUser).then(setBookings);
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'accepted': return <CheckCircle className="w-4 h-4 text-green-600" />;
      case 'rejected': return <XCircle className="w-4 h-4 text-red-600" />;
      default:         return <AlertCircle className="w-4 h-4 text-yellow-500" />;
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'accepted':  return { text: 'Aceito',    cls: 'bg-green-50  text-green-700  border-green-200'  };
      case 'rejected':  return { text: 'Recusado',  cls: 'bg-red-50    text-red-700    border-red-200'    };
      case 'cancelled': return { text: 'Cancelado', cls: 'bg-gray-100  text-gray-500   border-gray-200'   };
      default:          return { text: 'Pendente',  cls: 'bg-yellow-50 text-yellow-700 border-yellow-200' };
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-6 py-2.5 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <img src="/logo.png" alt="Logo" className="h-8" />
            <div>
              <div className="font-semibold text-sm text-gray-900">Centro Esportivo Educacional</div>
              <div className="text-xs text-gray-500">{currentUser}</div>
            </div>
          </div>
          <button
            onClick={handleLogout}
            className="flex items-center gap-1.5 px-3 py-1.5 text-sm text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <LogOut className="w-3.5 h-3.5" /> Sair
          </button>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-6 py-5">
        <div className="mb-4">
          <h1 className="text-xl font-bold text-gray-900">Agendamentos</h1>
          <p className="text-sm text-gray-500">Visualize e gerencie suas reservas de quadra</p>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-16 text-gray-400">
            <Loader2 className="w-6 h-6 animate-spin mr-2" />
            <span className="text-sm">Carregando...</span>
          </div>
        ) : error ? (
          <div className="bg-red-50 border border-red-200 rounded-xl p-6 text-center text-red-600">{error}</div>
        ) : (
          <div className="grid lg:grid-cols-3 gap-5">
            {/* Calendar */}
            <div className="lg:col-span-2">
              <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <CalendarIcon className="w-4 h-4 text-blue-600" />
                    <h2 className="text-sm font-bold text-gray-900">Disponibilidade das Quadras</h2>
                  </div>
                  <button
                    onClick={() => { setBookingInitialDate(undefined); setShowBookingModal(true); }}
                    className="flex items-center gap-1.5 px-3 py-1.5 bg-blue-600 text-white rounded-lg text-xs font-medium hover:bg-blue-700 transition-colors"
                  >
                    <Plus className="w-3.5 h-3.5" /> Agendar
                  </button>
                </div>

                <Calendar
                  bookings={calendarBookings}
                  closures={closures}
                  weeklyEvents={weeklyEvents}
                  onDateClick={setSelectedDate}
                  onDateDoubleClick={handleDateDoubleClick}
                  selectedDate={selectedDate}
                />
              </div>
            </div>

            {/* My bookings */}
            <div>
              <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4">
                <div className="flex items-center gap-2 mb-3">
                  <Clock className="w-4 h-4 text-blue-600" />
                  <h2 className="text-sm font-bold text-gray-900">Meus Agendamentos</h2>
                </div>

                <div className="space-y-2">
                  {bookings.length === 0 ? (
                    <div className="text-center py-6 text-gray-400">
                      <CalendarIcon className="w-8 h-8 mx-auto mb-2 text-gray-300" />
                      <p className="text-xs">Nenhum agendamento ainda</p>
                      <p className="text-xs mt-0.5 text-gray-400">Clique em &quot;Agendar&quot; para começar</p>
                    </div>
                  ) : (
                    bookings.map((booking) => {
                      const { text, cls } = getStatusLabel(booking.status);
                      return (
                        <button
                          key={booking.id}
                          onClick={() => setDetailBooking(booking)}
                          className="w-full text-left border border-gray-200 rounded-lg p-3 hover:border-blue-400 hover:shadow-sm transition-all"
                        >
                          <div className="flex items-start justify-between mb-1.5">
                            <div className="flex-1 min-w-0">
                              <div className="font-medium text-gray-900 text-xs">{booking.court}</div>
                              <div className="text-xs text-gray-500 mt-0.5">
                                {formatDatePtBR(booking.date, { day: '2-digit', month: 'short', year: 'numeric' })}
                                {' · '}{booking.time}
                              </div>
                              {booking.players.length > 0 && (
                                <div className="text-[10px] text-blue-600 mt-0.5">
                                  {booking.players.length} jogador{booking.players.length > 1 ? 'es' : ''}
                                </div>
                              )}
                            </div>
                            {getStatusIcon(booking.status)}
                          </div>
                          <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-medium border ${cls}`}>
                            {text}
                          </span>
                        </button>
                      );
                    })
                  )}
                </div>
              </div>
            </div>
          </div>
        )}
      </main>

      {showBookingModal && (
        <BookingModal
          onClose={() => { setShowBookingModal(false); setBookingInitialDate(undefined); }}
          onSubmit={handleNewBooking}
          weeklyEvents={weeklyEvents}
          initialDate={bookingInitialDate}
        />
      )}

      {detailBooking && (
        <BookingDetailModal
          booking={detailBooking}
          onClose={() => setDetailBooking(null)}
          onCancel={() => {
            handleCancelBooking(detailBooking.id);
            setDetailBooking(null);
          }}
        />
      )}

      {/* Floating chat button */}
      {!showChat && (
        <button
          onClick={() => setShowChat(true)}
          className="fixed bottom-4 right-4 w-11 h-11 bg-blue-600 text-white rounded-full shadow-lg hover:bg-blue-700 transition-colors flex items-center justify-center z-40"
          title="Falar com o suporte"
        >
          <MessageCircle className="w-6 h-6" />
        </button>
      )}

      {showChat && currentUser && (
        <ChatModal
          userName="Suporte"
          userEmail={currentUser}
          onClose={() => setShowChat(false)}
          senderRole="user"
        />
      )}
    </div>
  );
}
