import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { Thermometer, ShieldAlert, HeartPulse, Pill, ClipboardList, AlertTriangle } from "lucide-react";
import { useGetStudentsQuery } from "@/entities/student/api/studentsApi";
import { useGetVisitsQuery } from "@/entities/visit/api/visitsApi";
import { useGetAppointmentsQuery } from "@/entities/appointment/api/appointmentsApi";
import { useGetRemindersQuery } from "@/entities/reminder/api/remindersApi";
import styles from "./DashboardPage.module.scss";

const today = new Date().toISOString().slice(0, 10);

const COMPLAINT_ICONS: Record<string, { icon: typeof Thermometer; className: string }> = {
  Fever: { icon: Thermometer, className: "eventRed" },
  Injury: { icon: ShieldAlert, className: "eventBlue" },
  StomachPain: { icon: HeartPulse, className: "eventOrange" },
  Headache: { icon: HeartPulse, className: "eventOrange" },
  Allergy: { icon: AlertTriangle, className: "eventOrange" },
  MedicationGiven: { icon: Pill, className: "eventGreen" },
  Other: { icon: ClipboardList, className: "eventBlue" },
};

export function DashboardPage() {
  const { t } = useTranslation();
  const navigate = useNavigate();

  const { data: studentsData } = useGetStudentsQuery({ page: 1, pageSize: 100 });
  const { data: todayVisits = [] } = useGetVisitsQuery({ date: today });
  const { data: appointments = [] } = useGetAppointmentsQuery({});
  const { data: reminders = [] } = useGetRemindersQuery({});

  const totalStudents = studentsData?.meta?.total ?? 0;
  const visitsToday = todayVisits.length;

  // Reminders for today
  const todayReminders = reminders.filter((r) => {
    const rDate = r.dateTime.slice(0, 10);
    return rDate === today;
  });

  const emergencyAlerts = appointments.filter(
    (a) => a.priority === "Emergency" && a.status === "Pending"
  ).length;

  // Recent events = recent visits (latest first)
  const recentVisits = [...todayVisits].slice(0, 5);

  return (
    <div className={styles.page}>
      {/* Stats row */}
      <div className={styles.stats}>
        <div className={styles.statCard}>
          <div className={`${styles.statValue} ${styles.blue}`}>{totalStudents}</div>
          <div className={styles.statLabel}>{t("dashboard.totalStudents")}</div>
        </div>
        <div className={styles.statCard}>
          <div className={`${styles.statValue} ${styles.orange}`}>{todayReminders.length}</div>
          <div className={styles.statLabel}>{t("dashboard.medRemindersToday")}</div>
        </div>
        <div className={styles.statCard}>
          <div className={`${styles.statValue} ${styles.gray}`}>{visitsToday}</div>
          <div className={styles.statLabel}>{t("dashboard.visitsToday")}</div>
        </div>
        <div className={styles.statCard}>
          <div className={`${styles.statValue} ${styles.red}`}>{emergencyAlerts}</div>
          <div className={styles.statLabel}>{t("dashboard.emergencyAlerts")}</div>
        </div>
      </div>

      {/* Main grid */}
      <div className={styles.grid}>
        {/* Recent medical events */}
        <div className={styles.card}>
          <div className={styles.cardHeader}>
            <h2 className={styles.cardTitle}>{t("dashboard.recentEvents")}</h2>
          </div>
          <div className={styles.eventList}>
            {recentVisits.length === 0 && (
              <div className={styles.emptyState}>
                <span>{t("dashboard.noRecentEvents")}</span>
              </div>
            )}
            {recentVisits.map((visit) => {
              const iconInfo = COMPLAINT_ICONS[visit.complaintType] ?? COMPLAINT_ICONS.Other;
              const Icon = iconInfo.icon;
              return (
                <div key={visit.id} className={styles.event}>
                  <div className={`${styles.eventIcon} ${styles[iconInfo.className]}`}>
                    <Icon size={16} />
                  </div>
                  <div className={styles.eventContent}>
                    <div className={styles.eventTitle}>
                      {visit.complaintType} — {visit.firstName} {visit.lastName}
                    </div>
                    <div className={styles.eventMeta}>
                      {visit.arrivalTime} · {visit.complaint}
                      {visit.treatmentGiven ? `, ${visit.treatmentGiven}` : ""}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Today's visits */}
        <div className={styles.card}>
          <div className={styles.cardHeader}>
            <h2 className={styles.cardTitle}>{t("dashboard.todaysVisits")}</h2>
            <button className={styles.btn} onClick={() => navigate("/daily-log")}>
              {t("dashboard.openLog")}
            </button>
          </div>
          {todayVisits.length === 0 ? (
            <div className={styles.emptyState}>
              <span style={{ marginBottom: 8 }}><ClipboardList size={32} /></span>
              <span>{t("dashboard.noVisits")}</span>
            </div>
          ) : (
            <div className={styles.visitList}>
              {todayVisits.slice(0, 5).map((v) => (
                <div key={v.id} className={styles.visitRow}>
                  <span className={styles.visitName}>{v.firstName} {v.lastName}</span>
                  <span className={styles.visitTime}>{v.arrivalTime}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Today's medication reminders */}
      <div className={styles.card}>
        <div className={styles.cardHeader}>
          <h2 className={styles.cardTitle}>{t("dashboard.todaysMedReminders")}</h2>
        </div>
        <div className={styles.reminderList}>
          {todayReminders.length === 0 && (
            <div className={styles.emptyState}>
              <span>{t("dashboard.noRemindersToday")}</span>
            </div>
          )}
          {todayReminders.map((reminder) => {
            const time = new Date(reminder.dateTime).toLocaleTimeString([], {
              hour: "2-digit",
              minute: "2-digit",
            });
            let badgeClass = styles.badgePending;
            let badgeText = t("dashboard.statusPending");

            if (reminder.status === "Done") {
              badgeClass = styles.badgeDone;
              badgeText = t("dashboard.statusDone");
            } else if (reminder.status === "Missed") {
              badgeClass = styles.badgeMissed;
              badgeText = t("dashboard.statusMissed");
            } else if (reminder.status === "EarlyIntake") {
              badgeClass = styles.badgeEarly;
              badgeText = t("dashboard.statusEarly");
            } else {
              // Pending: check if upcoming (in the future)
              const reminderTime = new Date(reminder.dateTime);
              if (reminderTime > new Date()) {
                badgeClass = styles.badgeUpcoming;
                badgeText = t("dashboard.statusUpcoming");
              }
            }

            return (
              <div key={reminder.id} className={styles.reminder}>
                <div className={styles.reminderInfo}>
                  <span className={styles.reminderName}>{reminder.medication}</span>
                  <span className={styles.reminderMeta}>{reminder.studentName} · {time}</span>
                </div>
                <span className={`${styles.badge} ${badgeClass}`}>{badgeText}</span>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
