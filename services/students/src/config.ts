import { z } from "zod";

const EnvSchema = z.object({
  PORT: z.coerce.number().default(4002),
  DATABASE_URL: z.string().min(1),
});

export type Env = z.infer<typeof EnvSchema>;

export function loadConfig(): Env {
  const result = EnvSchema.safeParse(process.env);
  if (!result.success) {
    console.error("❌ Invalid environment variables:", result.error.format());
    process.exit(1);
  }
  return result.data;
}
