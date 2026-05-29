export interface Booking {
  id: string;
  date: string;
  time: string;
  court: string;
  equipment: string[];
  players: string[];
  status: 'pending' | 'accepted' | 'rejected' | 'cancelled';
}

export interface Request {
  id: string;
  userName: string;
  userEmail: string;
  date: string;
  time: string;
  court: string;
  equipment: string[];
  players: string[];
  status: 'pending' | 'accepted' | 'rejected' | 'cancelled';
  requestDate: string;
}

export interface Message {
  id: string;
  text: string;
  sender: 'admin' | 'user';
  timestamp: Date;
}

export interface CalendarEntry {
  date: string;
  court: string;
  time: string;
  userName: string;
}

export interface GymClosure {
  id: string;
  date: string;
  reason: string;
}

export interface WeeklyEvent {
  id: string;
  dayOfWeek: number;
  time: string;
  court: string;
  title: string;
}
