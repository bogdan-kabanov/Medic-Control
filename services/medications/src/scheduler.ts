import type { ReminderRepository } from "./repositories/reminder.repository.js";
import type { StatusLogRepository } from "./repositories/status-log.repository.js";
import type { Env } from "./config.js";

/**
 * Checks for missed reminders every 60 seconds.
 * If a reminder is still Pending and its window has passed, mark as Missed.
 */
export function startMissedChecker(
  reminderRepo: ReminderRepository,
  statusLogRepo: StatusLogRepository,
  config: Env
): void {
  setInterval(async () => {
    try {
      const now = new Date();
      const cutoff = new Date(now.getTime() - config.INTAKE_WINDOW_AFTER_MIN * 60 * 1000);

      const missed = await reminderRepo.findPendingBefore(cutoff);

      for (const reminder of missed) {
        await reminderRepo.markMissed(reminder.id);

        await statusLogRepo.create({
          reminderId: reminder.id,
          previousStatus: "Pending",
          newStatus: "Missed",
          changedBy: "system",
          reason: "Intake window expired",
        });
      }

      if (missed.length > 0) {
        console.log(`Marked ${missed.length} reminders as Missed`);
      }
    } catch (err) {
      console.error("Missed checker error:", err);
    }
  }, 60_000);
}
