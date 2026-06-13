// ─── @medcare/contracts ───────────────────────────────────────────────────────
// Единый пакет контрактов для всех сервисов и клиентов.
// Все типы выводятся из Zod-схем через z.infer — ручных interface нет.

export * from "./enums.js";
export * from "./branded-ids.js";
export * from "./entities.js";
export * from "./requests.js";
export * from "./responses.js";
export * from "./events.js";
export * from "./result.js";
