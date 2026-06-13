import { z } from "zod";
import { StudentId } from "./branded-ids.js";
import {
  Disease,
  Priority,
  DoctorType,
  VisitComplaintType,
  InventoryUnit,
  ConfirmedBy,
} from "./enums.js";
import { MedicationRefSchema, CounselorSchema } from "./entities.js";

// ─── Auth ─────────────────────────────────────────────────────────────────────

export const LoginRequestSchema = z.object({
  email: z.string().email(),
  password: z.string().min(6),
});
export type LoginRequest = z.infer<typeof LoginRequestSchema>;

export const RefreshRequestSchema = z.object({
  refreshToken: z.string().min(1),
});
export type RefreshRequest = z.infer<typeof RefreshRequestSchema>;

export const RegisterStudentRequestSchema = z.object({
  email: z.string().email(),
  firstName: z.string().min(1),
  lastName: z.string().min(1),
  studentId: StudentId,
});
export type RegisterStudentRequest = z.infer<typeof RegisterStudentRequestSchema>;

export const ActivateAccountRequestSchema = z.object({
  code: z.string().min(6).max(6),
  password: z.string().min(6),
});
export type ActivateAccountRequest = z.infer<typeof ActivateAccountRequestSchema>;

// ─── Students ─────────────────────────────────────────────────────────────────

export const CreateStudentSchema = z.object({
  firstName: z.string().min(1),
  lastName: z.string().min(1),
  grade: z.string().min(1),
  age: z.number().int().min(5).max(21),
  diseases: z.array(Disease),
  medications: z.array(MedicationRefSchema),
  counselor: CounselorSchema,
});
export type CreateStudent = z.infer<typeof CreateStudentSchema>;

export const UpdateStudentSchema = CreateStudentSchema.partial();
export type UpdateStudent = z.infer<typeof UpdateStudentSchema>;

// ─── Visits ───────────────────────────────────────────────────────────────────

export const CreateVisitSchema = z.object({
  studentId: StudentId.nullable().default(null),
  firstName: z.string().min(1),
  lastName: z.string().min(1),
  grade: z.string().min(1),
  arrivalTime: z.string().regex(/^\d{2}:\d{2}$/),
  complaint: z.string().min(1),
  complaintType: VisitComplaintType,
  treatmentGiven: z.string().default(""),
  scheduleDoctorAppointment: z.boolean().default(false),
});
export type CreateVisit = z.infer<typeof CreateVisitSchema>;

// ─── Appointments ─────────────────────────────────────────────────────────────

export const CreateAppointmentSchema = z.object({
  studentId: StudentId,
  doctorType: DoctorType,
  reason: z.string().min(1),
  dateTime: z.string().datetime(),
  priority: Priority,
});
export type CreateAppointment = z.infer<typeof CreateAppointmentSchema>;

// ─── Reminders ────────────────────────────────────────────────────────────────

export const CreateReminderSchema = z.object({
  studentId: StudentId,
  medication: z.string().min(1),
  dosage: z.string().min(1),
  dateTime: z.string().datetime(),
  notes: z.string().default(""),
});
export type CreateReminder = z.infer<typeof CreateReminderSchema>;

export const ConfirmReminderSchema = z.object({
  confirmedBy: ConfirmedBy,
});
export type ConfirmReminder = z.infer<typeof ConfirmReminderSchema>;

// ─── Inventory ────────────────────────────────────────────────────────────────

export const CreateInventoryItemSchema = z.object({
  name: z.string().min(1),
  unit: InventoryUnit,
  quantity: z.number().int().min(1),
  minThreshold: z.number().int().min(0).default(5),
});
export type CreateInventoryItem = z.infer<typeof CreateInventoryItemSchema>;

export const UpdateInventoryItemSchema = z.object({
  currentStock: z.number().int().min(0).optional(),
  minThreshold: z.number().int().min(0).optional(),
});
export type UpdateInventoryItem = z.infer<typeof UpdateInventoryItemSchema>;

// ─── Push subscription ────────────────────────────────────────────────────────

export const PushSubscriptionSchema = z.object({
  endpoint: z.string().url(),
  keys: z.object({
    p256dh: z.string().min(1),
    auth: z.string().min(1),
  }),
});
export type PushSubscription = z.infer<typeof PushSubscriptionSchema>;
