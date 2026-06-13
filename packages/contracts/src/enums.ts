import { z } from "zod";

// ─── Заболевания ──────────────────────────────────────────────────────────────

export const Disease = z.enum([
  "ADHD",
  "Asthma",
  "Anxiety",
  "LactoseIntolerance",
  "Epilepsy",
  "Diabetes",
  "None",
]);
export type Disease = z.infer<typeof Disease>;

// ─── Приоритет направления ────────────────────────────────────────────────────

export const Priority = z.enum(["Emergency", "High", "Medium", "Low"]);
export type Priority = z.infer<typeof Priority>;

// ─── Статус направления ───────────────────────────────────────────────────────

export const AppointmentStatus = z.enum([
  "Pending",
  "Approved",
  "Completed",
  "Cancelled",
]);
export type AppointmentStatus = z.infer<typeof AppointmentStatus>;

// ─── Статус напоминания ───────────────────────────────────────────────────────

export const ReminderStatus = z.enum([
  "Pending",
  "Done",
  "Missed",
  "EarlyIntake",
]);
export type ReminderStatus = z.infer<typeof ReminderStatus>;

// ─── Тип врача ────────────────────────────────────────────────────────────────

export const DoctorType = z.enum([
  "FamilyDoctor",
  "Pediatrician",
  "Neurologist",
  "Gastroenterologist",
  "Allergist",
  "Dermatologist",
  "Ophthalmologist",
]);
export type DoctorType = z.infer<typeof DoctorType>;

// ─── Единицы инвентаря ────────────────────────────────────────────────────────

export const InventoryUnit = z.enum(["Tablets", "Puffs", "ML", "Pieces"]);
export type InventoryUnit = z.infer<typeof InventoryUnit>;

// ─── Тип жалобы визита ────────────────────────────────────────────────────────

export const VisitComplaintType = z.enum([
  "Fever",
  "Injury",
  "StomachPain",
  "Headache",
  "Allergy",
  "MedicationGiven",
  "Other",
]);
export type VisitComplaintType = z.infer<typeof VisitComplaintType>;

// ─── Роли пользователей ───────────────────────────────────────────────────────

export const UserRole = z.enum(["nurse", "admin", "student"]);
export type UserRole = z.infer<typeof UserRole>;

// ─── Типы уведомлений ─────────────────────────────────────────────────────────

export const NotificationType = z.enum([
  "reminder_upcoming",
  "reminder_missed",
  "appointment_approved",
  "appointment_completed",
  "appointment_cancelled",
  "referral_created",
  "low_stock",
  "emergency_alert",
  "early_intake",
]);
export type NotificationType = z.infer<typeof NotificationType>;

// ─── Кто подтвердил приём ─────────────────────────────────────────────────────

export const ConfirmedBy = z.enum(["nurse", "student"]);
export type ConfirmedBy = z.infer<typeof ConfirmedBy>;
