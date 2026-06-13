import { z } from "zod";
import {
  StudentId,
  VisitId,
  AppointmentId,
  ReminderId,
  UserId,
  InventoryItemId,
  NotificationId,
} from "./branded-ids.js";
import {
  Disease,
  Priority,
  AppointmentStatus,
  ReminderStatus,
  DoctorType,
  InventoryUnit,
  VisitComplaintType,
  NotificationType,
  ConfirmedBy,
} from "./enums.js";

// ─── Student ──────────────────────────────────────────────────────────────────

export const MedicationRefSchema = z.object({
  name: z.string().min(1),
  dosage: z.string().min(1),
});
export type MedicationRef = z.infer<typeof MedicationRefSchema>;

export const CounselorSchema = z.object({
  name: z.string().min(1),
  phone: z.string().min(3),
});
export type Counselor = z.infer<typeof CounselorSchema>;

export const StudentSchema = z.object({
  id: StudentId,
  userId: UserId.nullable(),
  firstName: z.string().min(1),
  lastName: z.string().min(1),
  grade: z.string().min(1),
  age: z.number().int().min(5).max(21),
  diseases: z.array(Disease),
  medications: z.array(MedicationRefSchema),
  counselor: CounselorSchema,
  createdAt: z.string().datetime(),
  updatedAt: z.string().datetime(),
});
export type Student = z.infer<typeof StudentSchema>;

// ─── Visit ────────────────────────────────────────────────────────────────────

export const VisitSchema = z.object({
  id: VisitId,
  studentId: StudentId.nullable(),
  firstName: z.string().min(1),
  lastName: z.string().min(1),
  grade: z.string().min(1),
  arrivalTime: z.string().regex(/^\d{2}:\d{2}$/),
  complaint: z.string().min(1),
  complaintType: VisitComplaintType,
  treatmentGiven: z.string(),
  scheduledDoctorAppointment: z.boolean(),
  createdAt: z.string().datetime(),
});
export type Visit = z.infer<typeof VisitSchema>;

// ─── Appointment ──────────────────────────────────────────────────────────────

export const AppointmentSchema = z.object({
  id: AppointmentId,
  studentId: StudentId,
  studentName: z.string().min(1),
  doctorType: DoctorType,
  reason: z.string().min(1),
  dateTime: z.string().datetime(),
  priority: Priority,
  status: AppointmentStatus,
  createdAt: z.string().datetime(),
});
export type Appointment = z.infer<typeof AppointmentSchema>;

// ─── Reminder ─────────────────────────────────────────────────────────────────

export const ReminderSchema = z.object({
  id: ReminderId,
  studentId: StudentId,
  studentName: z.string().min(1),
  medication: z.string().min(1),
  dosage: z.string().min(1),
  dateTime: z.string().datetime(),
  notes: z.string(),
  status: ReminderStatus,
  confirmedAt: z.string().datetime().nullable(),
  confirmedBy: ConfirmedBy.nullable(),
});
export type Reminder = z.infer<typeof ReminderSchema>;

// ─── Inventory Item ───────────────────────────────────────────────────────────

export const InventoryItemSchema = z.object({
  id: InventoryItemId,
  name: z.string().min(1),
  unit: InventoryUnit,
  currentStock: z.number().int().min(0),
  minThreshold: z.number().int().min(0),
  updatedAt: z.string().datetime(),
});
export type InventoryItem = z.infer<typeof InventoryItemSchema>;

// ─── Notification ─────────────────────────────────────────────────────────────

export const NotificationSchema = z.object({
  id: NotificationId,
  userId: UserId,
  type: NotificationType,
  title: z.string().min(1),
  message: z.string().min(1),
  isRead: z.boolean(),
  metadata: z.record(z.string(), z.unknown()).optional(),
  createdAt: z.string().datetime(),
});
export type Notification = z.infer<typeof NotificationSchema>;

// ─── User (auth) ──────────────────────────────────────────────────────────────

export const UserSchema = z.object({
  id: UserId,
  email: z.string().email(),
  firstName: z.string().min(1),
  lastName: z.string().min(1),
  role: z.enum(["nurse", "admin", "student"]),
  studentId: StudentId.nullable(),
  isActive: z.boolean(),
  createdAt: z.string().datetime(),
});
export type User = z.infer<typeof UserSchema>;
