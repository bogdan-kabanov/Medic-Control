import { z } from "zod";

// ─── Branded ID типы ──────────────────────────────────────────────────────────
// Каждый ID — UUID с brand-меткой. Компилятор не позволит передать
// StudentId туда, где ожидается AppointmentId.

export const StudentId = z.string().uuid().brand<"StudentId">();
export type StudentId = z.infer<typeof StudentId>;

export const VisitId = z.string().uuid().brand<"VisitId">();
export type VisitId = z.infer<typeof VisitId>;

export const AppointmentId = z.string().uuid().brand<"AppointmentId">();
export type AppointmentId = z.infer<typeof AppointmentId>;

export const ReminderId = z.string().uuid().brand<"ReminderId">();
export type ReminderId = z.infer<typeof ReminderId>;

export const UserId = z.string().uuid().brand<"UserId">();
export type UserId = z.infer<typeof UserId>;

export const InventoryItemId = z.string().uuid().brand<"InventoryItemId">();
export type InventoryItemId = z.infer<typeof InventoryItemId>;

export const NotificationId = z.string().uuid().brand<"NotificationId">();
export type NotificationId = z.infer<typeof NotificationId>;
