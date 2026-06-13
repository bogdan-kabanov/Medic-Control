import { useTranslation } from "react-i18next";
import { useGetMyVisitsQuery } from "@/entities/visit/api/visitsApi";
import styles from "./VisitHistoryPage.module.scss";

export function VisitHistoryPage() {
  const { t } = useTranslation();
  const { data: visits = [], isLoading, error } = useGetMyVisitsQuery();

  if (isLoading) return <div className={styles.loading}>{t("common.loading")}</div>;
  if (error) return <div className={styles.error}>{t("common.error")}</div>;

  return (
    <div className={styles.page}>
      <h1 className={styles.title}>{t("visits.title")}</h1>

      {visits.length === 0 && (
        <div className={styles.empty}>{t("visits.noVisits")}</div>
      )}

      <div className={styles.list}>
        {visits.map((visit) => (
          <div key={visit.id} className={styles.card}>
            <div className={styles.date}>
              {new Date(visit.createdAt).toLocaleDateString([], {
                weekday: "short",
                year: "numeric",
                month: "short",
                day: "numeric",
              })}
            </div>
            <div className={styles.complaint}>{visit.complaint}</div>
            <div className={styles.treatment}>
              {t("visits.treatment")}: {visit.treatmentGiven || t("visits.noneGiven")}
            </div>
            <div className={styles.referral}>
              {visit.scheduledDoctorAppointment ? (
                <span className={styles.referralYes}>⚠ {t("visits.doctorReferralIssued")}</span>
              ) : (
                <span className={styles.referralNo}>{t("visits.noReferral")}</span>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
