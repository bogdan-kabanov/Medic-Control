import { useTranslation } from "react-i18next";
import { useGetMyRemindersQuery, useConfirmReminderMutation } from "@/entities/reminder/api/remindersApi";
import { useGetMyAppointmentsQuery } from "@/entities/appointment/api/appointmentsApi";
import styles from "./HomePage.module.scss";

export function HomePage() {
  const { t } = useTranslation();
  const { data: reminders = [], isLoading: loadingReminders } = useGetMyRemindersQuery();
  const { data: appointments = [], isLoading: loadingAppts } = useGetMyAppointmentsQuery();
  const [confirmReminder] = useConfirmReminderMutation();

  const pendingReminders = reminders.filter((r) => r.status === "Pending");
  const pendingAppts = appointments.filter((a) => a.status === "Pending" || a.status === "Approved");
  const nextReminder = pendingReminders[0];
  const nextAppointment = pendingAppts[0];

  const isLoading = loadingReminders || loadingAppts;

  const handleTakeNow = async () => {
    if (!nextReminder) return;
    try {
      await confirmReminder(nextReminder.id).unwrap();
    } catch (err) {
      alert(t("common.error"));
    }
  };

  if (isLoading) {
    return <div className={styles.loading}>{t("common.loading")}</div>;
  }

  return (
    <div className={styles.page}>
      <h1 className={styles.greeting}>{t("home.welcome")}</h1>
      <p className={styles.subtitle}>{t("home.subtitle")}</p>

      <div className={styles.statsRow}>
        <div className={styles.statCard}>
          <div className={styles.statValue}>{pendingReminders.length}</div>
          <div className={styles.statLabel}>{t("home.remindersToday")}</div>
        </div>
        <div className={styles.statCard}>
          <div className={styles.statValue}>{pendingAppts.length}</div>
          <div className={styles.statLabel}>{t("home.appointmentsPending")}</div>
        </div>
      </div>

      <div className={styles.card}>
        <div className={styles.cardTitle}>{t("home.nextMedication")}</div>
        {nextReminder ? (
          <>
            <div className={styles.medName}>{nextReminder.medication}</div>
            <div className={styles.medDosage}>{nextReminder.dosage}</div>
            <div className={styles.medTime}>
              {new Date(nextReminder.dateTime).toLocaleTimeString([], {
                hour: "2-digit",
                minute: "2-digit",
              })}
            </div>
            <button
              className={styles.takeBtn}
              onClick={handleTakeNow}
            >
              {t("home.takeNow")}
            </button>
          </>
        ) : (
          <div className={styles.emptyCard}>{t("home.noPendingMedications")}</div>
        )}
      </div>

      <div className={styles.card}>
        <div className={styles.cardTitle}>{t("home.nextAppointment")}</div>
        {nextAppointment ? (
          <>
            <div className={styles.apptDoctor}>{nextAppointment.doctorType}</div>
            <div className={styles.apptDate}>
              {new Date(nextAppointment.dateTime).toLocaleString()}
            </div>
            <span
              className={`${styles.statusBadge} ${
                nextAppointment.status === "Approved"
                  ? styles.statusApproved
                  : styles.statusPending
              }`}
            >
              {nextAppointment.status}
            </span>
          </>
        ) : (
          <div className={styles.emptyCard}>{t("home.noUpcomingAppointments")}</div>
        )}
      </div>
    </div>
  );
}
