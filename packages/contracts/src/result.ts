// ─── Result type ──────────────────────────────────────────────────────────────
// Используется для бизнес-операций вместо throw.

export interface AppError {
  code: string;
  message: string;
  statusCode: number;
}

export type Result<T, E = AppError> =
  | { ok: true; data: T }
  | { ok: false; error: E };

export function ok<T>(data: T): Result<T, never> {
  return { ok: true, data };
}

export function err<E = AppError>(error: E): Result<never, E> {
  return { ok: false, error };
}
