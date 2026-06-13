import { z } from "zod";

const EnvSchema = z.object({
  PORT: z.coerce.number().default(4005),
  DATABASE_URL: z.string().min(1),
  RABBITMQ_URL: z.string().default("amqp://localhost:5672"),
  REDIS_URL: z.string().default("redis://localhost:6379"),
  INTAKE_WINDOW_BEFORE_MIN: z.coerce.number().default(30),
  INTAKE_WINDOW_AFTER_MIN: z.coerce.number().default(60),
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
