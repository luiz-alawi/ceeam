export type BookingStatus =
  | 'pending'
  | 'accepted'
  | 'rejected'
  | 'cancelled'
  | 'waitlisted';

export interface Booking {
  id: string;
  date: string;
  time: string;
  court: string;
  equipment: string[];
  players: string[];
  status: BookingStatus;
  attended?: boolean | null;
  recurringGroupId?: string | null;
  reason?: string | null;
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
  status: BookingStatus;
  requestDate: string;
  attended?: boolean | null;
  recurringGroupId?: string | null;
  reason?: string | null;
}

export interface BookingSettings {
  maxPerUserPerWeek: number;
  minAdvanceHours: number;
  maxAdvanceDays: number;
  waitlistEnabled: boolean;
}

export interface AdminUser {
  id: string;
  name: string;
  email: string;
  isAdmin: boolean;
  createdAt: string;
}

export interface UserStats {
  total: number;
  accepted: number;
  rejected: number;
  cancelled: number;
  pending: number;
  waitlisted: number;
  attended: number;
  absent: number;
  acceptanceRate: number;
  noShowRate: number;
  recent: {
    id: string;
    date: string;
    time: string;
    court: string;
    status: BookingStatus;
    attended: boolean | null;
  }[];
}

export interface AuditEntry {
  id: string;
  actorEmail: string;
  actorName: string | null;
  action: string;
  target: string | null;
  targetName: string | null; // nome do usuário afetado, quando o alvo é um e-mail
  details: string | null;
  createdAt: string;
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
