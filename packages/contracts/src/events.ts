import { z } from "zod";
import {
  StudentId,
  VisitId,
  AppointmentId,
  ReminderId,
  InventoryItemId,
} from "./branded-ids.js";
import {
  AppointmentStatus,
  ReminderStatus,
  VisitComplaintType,
} from "./enums.js";

// ─── Visit Events ─────────────────────────────────────────────────────────────

export const VisitCreatedEvent = z.object({
  type: z.literal("visit.created"),
  visitId: VisitId,
  studentId: StudentId.nullable(),
  complaintType: VisitComplaintType,
  date: z.string(),
});
export type VisitCreatedEvent = z.infer<typeof VisitCreatedEvent>;

export const ReferralCreatedEvent = z.object({
  type: z.literal("visit.referral.created"),
  visitId: VisitId,
  studentId: StudentId,
  studentName: z.string(),
  reason: z.string(),
  complaintType: VisitComplaintType,
});
export type ReferralCreatedEvent = z.infer<typeof ReferralCreatedEvent>;

// ─── Appointment Events ───────────────────────────────────────────────────────

export const AppointmentStatusChangedEvent = z.object({
  type: z.literal("appointment.status.changed"),
  appointmentId: AppointmentId,
  studentId: StudentId,
  previousStatus: AppointmentStatus,
  newStatus: AppointmentStatus,
});
export type AppointmentStatusChangedEvent = z.infer<
  typeof AppointmentStatusChangedEvent
>;

// ─── Reminder Events ──────────────────────────────────────────────────────────

export const ReminderStatusChangedEvent = z.object({
  type: z.literal("reminder.status.changed"),
  reminderId: ReminderId,
  studentId: StudentId,
  previousStatus: ReminderStatus,
  newStatus: ReminderStatus,
  medication: z.string(),
});
export type ReminderStatusChangedEvent = z.infer<
  typeof ReminderStatusChangedEvent
>;

export const ReminderUpcomingEvent = z.object({
  type: z.literal("reminder.upcoming"),
  reminderId: ReminderId,
  studentId: StudentId,
  medication: z.string(),
  dateTime: z.string().datetime(),
});
export type ReminderUpcomingEvent = z.infer<typeof ReminderUpcomingEvent>;

// ─── Inventory Events ─────────────────────────────────────────────────────────

export const LowStockEvent = z.object({
  type: z.literal("inventory.low_stock"),
  itemId: InventoryItemId,
  name: z.string(),
  currentStock: z.number(),
  minThreshold: z.number(),
});
export type LowStockEvent = z.infer<typeof LowStockEvent>;

// ─── Union of all events ──────────────────────────────────────────────────────

export const DomainEvent = z.discriminatedUnion("type", [
  VisitCreatedEvent,
  ReferralCreatedEvent,
  AppointmentStatusChangedEvent,
  ReminderStatusChangedEvent,
  ReminderUpcomingEvent,
  LowStockEvent,
]);
export type DomainEvent = z.infer<typeof DomainEvent>;
