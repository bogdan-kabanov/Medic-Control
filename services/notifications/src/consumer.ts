import { consumeEvents } from "./rabbitmq.js";
import type { NotificationService } from "./services/notification.service.js";

export async function startConsumer(notificationService: NotificationService): Promise<void> {
  await consumeEvents(
    "notifications.all",
    [
      "visit.created",
      "visit.referral.created",
      "appointment.status.changed",
      "reminder.status.changed",
      "reminder.upcoming",
      "inventory.low_stock",
    ],
    async (msg, routingKey) => {
      // For now, just log the events. In production, store notifications and push to users.
      console.log(`[notifications] Received event: ${routingKey}`, msg);
    }
  );
}
