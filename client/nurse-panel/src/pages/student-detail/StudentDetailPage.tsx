import { useParams, useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { ArrowLeft } from "lucide-react";
import { useGetStudentQuery } from "@/entities/student/api/studentsApi";
import styles from "./StudentDetailPage.module.scss";

export function StudentDetailPage() {
  const { t } = useTranslation();
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { data: student, isLoading, error } = useGetStudentQuery(id!);

  if (isLoading) return <div className={styles.loading}>{t("common.loading")}</div>;
  if (error || !student) return <div className={styles.error}>{t("common.error")}</div>;

  return (
    <div className={styles.page}>
      <button className={styles.backBtn} onClick={() => navigate("/students")}>
        <ArrowLeft size={18} />
        {t("students.backToList")}
      </button>

      <div className={styles.header}>
        <div className={styles.avatar}>
          {student.firstName[0]}{student.lastName[0]}
        </div>
        <div className={styles.headerInfo}>
          <h1 className={styles.name}>{student.firstName} {student.lastName}</h1>
          <span className={styles.meta}>{student.grade} · {student.age} {t("students.yearsOld")}</span>
        </div>
      </div>

      <div className={styles.grid}>
        {/* Diseases */}
        <div className={styles.card}>
          <h3 className={styles.cardTitle}>{t("students.diseases")}</h3>
          <div className={styles.tags}>
            {student.diseases.length > 0
              ? student.diseases.map((d) => (
                  <span key={d} className={styles.diseaseBadge}>{d}</span>
                ))
              : <span className={styles.none}>{t("students.none")}</span>
            }
          </div>
        </div>

        {/* Medications */}
        <div className={styles.card}>
          <h3 className={styles.cardTitle}>{t("students.medications")}</h3>
          <div className={styles.medList}>
            {student.medications.length > 0
              ? student.medications.map((m, i) => (
                  <div key={i} className={styles.medItem}>
                    <span className={styles.medName}>{m.name}</span>
                    <span className={styles.medDosage}>{m.dosage}</span>
                  </div>
                ))
              : <span className={styles.none}>{t("students.none")}</span>
            }
          </div>
        </div>

        {/* Counselor */}
        <div className={styles.card}>
          <h3 className={styles.cardTitle}>{t("students.counselor")}</h3>
          <div className={styles.counselorInfo}>
            <span className={styles.counselorName}>{student.counselor.name}</span>
            <span className={styles.counselorPhone}>{student.counselor.phone}</span>
          </div>
        </div>

        {/* Info */}
        <div className={styles.card}>
          <h3 className={styles.cardTitle}>{t("students.info")}</h3>
          <div className={styles.infoRow}>
            <span className={styles.infoLabel}>ID</span>
            <span className={styles.infoValue}>{student.id}</span>
          </div>
          <div className={styles.infoRow}>
            <span className={styles.infoLabel}>{t("students.createdAt")}</span>
            <span className={styles.infoValue}>{new Date(student.createdAt).toLocaleDateString()}</span>
          </div>
        </div>
      </div>
    </div>
  );
}
