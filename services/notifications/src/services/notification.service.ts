import type { NotificationRepository } from "../repositories/notification.repository.js";

export class NotificationService {
  constructor(private notificationRepo: NotificationRepository) {}

  async storeNotification(data: {
    userId: string;
    type: string;
    title: string;
    message: string;
    metadata?: Record<string, unknown>;
  }) {
    return this.notificationRepo.create(data);
  }
}
