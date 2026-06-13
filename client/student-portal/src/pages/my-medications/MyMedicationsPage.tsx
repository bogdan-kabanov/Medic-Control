import { useState } from "react";
import { useTranslation } from "react-i18next";
import { useGetMyRemindersQuery, useConfirmReminderMutation } from "@/entities/reminder/api/remindersApi";
import type { Reminder } from "@/entities/reminder/api/remindersApi";
import styles from "./MyMedicationsPage.module.scss";

// Intake window: can confirm 30 min before scheduled time
const WINDOW_BEFORE_MIN = 30;

function canTakeNow(dateTime: string): boolean {
  const scheduled = new Date(dateTime);
  const now = new Date();
  const windowStart = new Date(scheduled.getTime() - WINDOW_BEFORE_MIN * 60 * 1000);
  return now >= windowStart;
}

function getTimeUntil(dateTime: string): string {
  const scheduled = new Date(dateTime);
  const now = new Date();
  const diffMs = scheduled.getTime() - now.getTime();
  if (diffMs <= 0) return "";
  const diffMin = Math.floor(diffMs / 60000);
  if (diffMin < 60) return `${diffMin} min`;
  const hours = Math.floor(diffMin / 60);
  const mins = diffMin % 60;
  return `${hours}h ${mins}m`;
}

export function MyMedicationsPage() {
  const { t } = useTranslation();
  const { data: reminders = [], isLoading, error } = useGetMyRemindersQuery();
  const [confirmReminder] = useConfirmReminderMutation();
  const [notification, setNotification] = useState<{ type: "success" | "warning" | "error"; message: string } | null>(null);

  const getBadgeClass = (status: Reminder["status"]) => {
    const map: Record<string, string> = {
      Done: styles.badgeDone,
      Pending: styles.badgePending,
      Missed: styles.badgeMissed,
      EarlyIntake: styles.badgeEarly,
    };
    return map[status] || styles.badgePending;
  };

  const getStatusLabel = (status: Reminder["status"]) => {
    switch (status) {
      case "Done": return t("medications.statusDone");
      case "Pending": return t("medications.statusPending");
      case "Missed": return t("medications.statusMissed");
      case "EarlyIntake": return t("medications.statusEarly");
      default: return status;
    }
  };

  const handleConfirm = async (reminder: Reminder) => {
    try {
      const result = await confirmReminder(reminder.id).unwrap();

      if (result.status === "EarlyIntake") {
        const plannedTime = new Date(reminder.dateTime);
        const now = new Date();
        const diffMin = Math.round((plannedTime.getTime() - now.getTime()) / 60000);
        setNotification({
          type: "warning",
          message: t("medications.earlyIntakeWarning", { minutes: diffMin, medication: reminder.medication }),
        });
      } else {
        // Show course progress if available
        const progress = (reminder as any).courseProgress;
        const progressText = progress ? ` (${progress.done + 1}/${progress.total})` : "";
        setNotification({
          type: "success",
          message: t("medications.intakeConfirmed", { medication: reminder.medication }) + progressText,
        });
      }
      setTimeout(() => setNotification(null), 5000);
    } catch {
      setNotification({ type: "error", message: t("common.error") });
      setTimeout(() => setNotification(null), 5000);
    }
  };

  if (isLoading) return <div className={styles.loading}>{t("common.loading")}</div>;
  if (error) return <div className={styles.error}>{t("common.error")}</div>;

  const todayReminders = reminders;

  return (
    <div className={styles.page}>
      <h1 className={styles.title}>{t("medications.title")}</h1>
      <p className={styles.subtitle}>{t("medications.todaySchedule")}</p>

      {notification && (
        <div className={`${styles.notification} ${styles[`notification_${notification.type}`]}`}>
          <span>{notification.message}</span>
          <button className={styles.notificationClose} onClick={() => setNotification(null)}>×</button>
        </div>
      )}

      {todayReminders.length === 0 && (
        <div className={styles.empty}>
          <div style={{ fontSize: 48, marginBottom: 12 }}>✅</div>
          {t("medications.allDoneToday")}
        </div>
      )}

      <div className={styles.list}>
        {todayReminders.map((reminder) => {
          const canTake = canTakeNow(reminder.dateTime);
          const timeLeft = !canTake ? getTimeUntil(reminder.dateTime) : "";
          const progress = (reminder as any).courseProgress as { total: number; done: number } | undefined;
          const time = new Date(reminder.dateTime).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });

          return (
            <div
              key={reminder.id}
              className={`${styles.card} ${reminder.status === "Done" || reminder.status === "EarlyIntake" ? styles.cardDone : ""} ${reminder.status === "Missed" ? styles.cardMissed : ""}`}
            >
              <div className={styles.cardTop}>
                <div className={styles.cardLeft}>
                  <span className={styles.medName}>{reminder.medication}</span>
                  <span className={styles.dosage}>{reminder.dosage}</span>
                </div>
                <div className={styles.cardRight}>
                  <span className={styles.time}>{time}</span>
                  <span className={`${styles.badge} ${getBadgeClass(reminder.status)}`}>
                    {getStatusLabel(reminder.status)}
                  </span>
                </div>
              </div>

              {/* Course progress */}
              {progress && (
                <div className={styles.progressBar}>
                  <div className={styles.progressTrack}>
                    <div
                      className={styles.progressFill}
                      style={{ width: `${(progress.done / progress.total) * 100}%` }}
                    />
                  </div>
                  <span className={styles.progressText}>
                    {progress.done}/{progress.total} {t("medications.doses")}
                  </span>
                </div>
              )}

              {/* Action area */}
              {reminder.status === "Pending" && (
                <div className={styles.actionArea}>
                  {canTake ? (
                    <button className={styles.confirmBtn} onClick={() => handleConfirm(reminder)}>
                      {t("medications.iTookIt")}
                    </button>
                  ) : (
                    <div className={styles.waitMessage}>
                      ⏰ {t("medications.availableIn")} {timeLeft}
                    </div>
                  )}
                </div>
              )}

              {reminder.confirmedAt && (
                <div className={styles.confirmedInfo}>
                  {t("medications.confirmedAt")}: {new Date(reminder.confirmedAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
