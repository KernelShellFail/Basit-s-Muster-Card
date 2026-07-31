// Canonical domain types live in src/services/db.ts (the single source of truth).
// This module re-exports them for backwards compatibility with imports from '../types'.
export type {
  Role,
  UserProfile,
  LabourSubmission,
  Organization,
  Site,
  Worker,
  AttendanceStatus,
  AttendanceRecord,
  LeaveRequest,
  PaymentRecord,
  ChatMessage,
  SystemNotification,
} from '../services/db';
