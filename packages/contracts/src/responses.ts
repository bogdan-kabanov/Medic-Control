import { z } from "zod";

// ─── Пагинация ────────────────────────────────────────────────────────────────

export const PaginationMetaSchema = z.object({
  total: z.number().int().min(0),
  page: z.number().int().min(1),
  pageSize: z.number().int().min(1).max(100),
  totalPages: z.number().int().min(0),
});
export type PaginationMeta = z.infer<typeof PaginationMetaSchema>;

export function paginatedResponse<T extends z.ZodType>(itemSchema: T) {
  return z.object({
    items: z.array(itemSchema),
    meta: PaginationMetaSchema,
  });
}

// ─── Ошибка API ───────────────────────────────────────────────────────────────

export const ApiErrorSchema = z.object({
  statusCode: z.number().int(),
  error: z.string(),
  message: z.string(),
  details: z
    .array(
      z.object({
        field: z.string(),
        message: z.string(),
      })
    )
    .optional(),
});
export type ApiError = z.infer<typeof ApiErrorSchema>;

// ─── Auth response ────────────────────────────────────────────────────────────

export const LoginResponseSchema = z.object({
  accessToken: z.string().min(1),
  refreshToken: z.string().min(1),
});
export type LoginResponse = z.infer<typeof LoginResponseSchema>;

export const RefreshResponseSchema = z.object({
  accessToken: z.string().min(1),
});
export type RefreshResponse = z.infer<typeof RefreshResponseSchema>;

// ─── Dashboard summary ────────────────────────────────────────────────────────

export const DashboardSummarySchema = z.object({
  totalStudents: z.number().int().min(0),
  medRemindersToday: z.number().int().min(0),
  visitsToday: z.number().int().min(0),
  emergencyAlerts: z.number().int().min(0),
});
export type DashboardSummary = z.infer<typeof DashboardSummarySchema>;
