import { useTranslation } from "react-i18next";
import { useGetMyAppointmentsQuery } from "@/entities/appointment/api/appointmentsApi";
import type { Appointment } from "@/entities/appointment/api/appointmentsApi";
import styles from "./MyAppointmentsPage.module.scss";

export function MyAppointmentsPage() {
  const { t } = useTranslation();
  const { data: appointments = [], isLoading, error } = useGetMyAppointmentsQuery();

  const getPriorityClass = (priority: Appointment["priority"]) => {
    const map: Record<string, string> = {
      Emergency: styles.priorityEmergency,
      High: styles.priorityHigh,
      Medium: styles.priorityMedium,
      Low: styles.priorityLow,
    };
    return map[priority] || styles.priorityLow;
  };

  const getStatusClass = (status: Appointment["status"]) => {
    const map: Record<string, string> = {
      Pending: styles.statusPending,
      Approved: styles.statusApproved,
      Completed: styles.statusCompleted,
      Cancelled: styles.statusCancelled,
    };
    return map[status] || "";
  };

  if (isLoading) return <div className={styles.loading}>{t("common.loading")}</div>;
  if (error) return <div className={styles.error}>{t("common.error")}</div>;

  return (
    <div className={styles.page}>
      <h1 className={styles.title}>{t("appointments.title")}</h1>

      {appointments.length === 0 && (
        <div className={styles.empty}>{t("appointments.noAppointments")}</div>
      )}

      <div className={styles.list}>
        {appointments.map((appt) => (
          <div key={appt.id} className={styles.card}>
            <div className={styles.cardTop}>
              <span className={styles.doctorType}>{appt.doctorType}</span>
              <span className={`${styles.priority} ${getPriorityClass(appt.priority)}`}>
                {appt.priority}
              </span>
            </div>
            <div className={styles.reason}>{appt.reason}</div>
            <div className={styles.dateTime}>
              {new Date(appt.dateTime).toLocaleString()}
            </div>
            <span className={`${styles.statusBadge} ${getStatusClass(appt.status)}`}>
              {appt.status}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
