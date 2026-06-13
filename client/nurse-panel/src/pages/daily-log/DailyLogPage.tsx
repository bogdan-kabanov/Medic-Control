import { useState } from "react";
import { useTranslation } from "react-i18next";
import { useGetVisitsQuery, useCreateVisitMutation } from "@/entities/visit/api/visitsApi";
import { useGetInventoryQuery } from "@/entities/inventory/api/inventoryApi";
import type { CreateVisit } from "@/entities/visit/api/visitsApi";
import styles from "./DailyLogPage.module.scss";

const today = new Date().toISOString().slice(0, 10);

export function DailyLogPage() {
  const { t } = useTranslation();
  const [search, setSearch] = useState("");
  const [showModal, setShowModal] = useState(false);
  const { data: visits = [], isLoading, error } = useGetVisitsQuery({ date: today });
  const [createVisit, { isLoading: creating }] = useCreateVisitMutation();

  const filtered = visits.filter((v) => {
    const name = `${v.firstName} ${v.lastName}`.toLowerCase();
    return name.includes(search.toLowerCase());
  });

  return (
    <div className={styles.page}>
      <div className={styles.header}>
        <div className={styles.headerLeft}>
          <h1 className={styles.title}>{t("dailyLog.title")}</h1>
          <span className={styles.date}>
            {new Date().toLocaleDateString("en-US", {
              weekday: "long",
              year: "numeric",
              month: "long",
              day: "numeric",
            })}
          </span>
        </div>
        <button className={styles.addBtn} onClick={() => setShowModal(true)}>
          {t("dailyLog.recordVisit")}
        </button>
      </div>

      <div className={styles.filters}>
        <input
          className={styles.search}
          placeholder={t("dailyLog.searchPlaceholder")}
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
        <select className={styles.select}>
          <option>{t("dailyLog.allVisits")}</option>
          <option>{t("dailyLog.withReferral")}</option>
          <option>{t("dailyLog.withoutReferral")}</option>
        </select>
      </div>

      {isLoading && <div className={styles.loading}>{t("common.loading")}</div>}
      {error && <div className={styles.error}>{t("common.error")}</div>}

      {!isLoading && !error && (
        <table className={styles.table}>
          <thead>
            <tr>
              <th>{t("dailyLog.name")}</th>
              <th>{t("dailyLog.class")}</th>
              <th>{t("dailyLog.time")}</th>
              <th>{t("dailyLog.complaint")}</th>
              <th>{t("dailyLog.medicationGiven")}</th>
              <th>{t("dailyLog.doctorReferral")}</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((visit) => (
              <tr key={visit.id}>
                <td>{visit.firstName} {visit.lastName}</td>
                <td>{visit.grade}</td>
                <td>{visit.arrivalTime}</td>
                <td>{visit.complaint}</td>
                <td>{visit.treatmentGiven || "—"}</td>
                <td>
                  {visit.scheduledDoctorAppointment ? (
                    <span className={styles.referralYes}>{t("common.yes")}</span>
                  ) : (
                    <span className={styles.referralNo}>{t("common.no")}</span>
                  )}
                </td>
              </tr>
            ))}
            {filtered.length === 0 && !isLoading && (
              <tr>
                <td colSpan={6} style={{ textAlign: "center", color: "#94a3b8" }}>
                  {t("dailyLog.noVisits")}
                </td>
              </tr>
            )}
          </tbody>
        </table>
      )}

      {showModal && (
        <RecordVisitModal
          creating={creating}
          onClose={() => setShowModal(false)}
          onSubmit={async (data) => {
            try {
              await createVisit(data).unwrap();
              setShowModal(false);
            } catch (err) {
              alert(t("common.error"));
            }
          }}
        />
      )}
    </div>
  );
}

function RecordVisitModal({
  onClose,
  onSubmit,
  creating,
}: {
  onClose: () => void;
  onSubmit: (data: CreateVisit) => Promise<void>;
  creating: boolean;
}) {
  const { t } = useTranslation();
  const { data: inventoryItems = [] } = useGetInventoryQuery({});
  const [form, setForm] = useState<CreateVisit & { inventoryItemId: string }>({
    firstName: "",
    lastName: "",
    grade: "",
    arrivalTime: new Date().toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit", hour12: false }),
    complaint: "",
    complaintType: "Other",
    treatmentGiven: "",
    scheduleDoctorAppointment: false,
    inventoryItemId: "",
  });

  const handleChange = (field: string, value: string | boolean) => {
    setForm((prev) => ({ ...prev, [field]: value }));
  };

  const handleInventorySelect = (itemId: string) => {
    const item = inventoryItems.find((i) => i.id === itemId);
    setForm((prev) => ({
      ...prev,
      inventoryItemId: itemId,
      treatmentGiven: item ? item.name : "",
    }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit(form as any);
  };

  return (
    <div className={styles.overlay} onClick={onClose}>
      <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
        <h2 className={styles.modalTitle}>{t("dailyLog.modalTitle")}</h2>
        <form className={styles.form} onSubmit={handleSubmit}>
          <div className={styles.row}>
            <div className={styles.field}>
              <label className={styles.label}>{t("dailyLog.firstName")}</label>
              <input
                className={styles.input}
                value={form.firstName}
                onChange={(e) => handleChange("firstName", e.target.value)}
                required
              />
            </div>
            <div className={styles.field}>
              <label className={styles.label}>{t("dailyLog.lastName")}</label>
              <input
                className={styles.input}
                value={form.lastName}
                onChange={(e) => handleChange("lastName", e.target.value)}
                required
              />
            </div>
          </div>
          <div className={styles.row}>
            <div className={styles.field}>
              <label className={styles.label}>{t("dailyLog.classGrade")}</label>
              <input
                className={styles.input}
                value={form.grade}
                onChange={(e) => handleChange("grade", e.target.value)}
                required
              />
            </div>
            <div className={styles.field}>
              <label className={styles.label}>{t("dailyLog.arrivalTime")}</label>
              <input
                className={styles.input}
                type="time"
                value={form.arrivalTime}
                onChange={(e) => handleChange("arrivalTime", e.target.value)}
                required
              />
            </div>
          </div>
          <div className={styles.field}>
            <label className={styles.label}>{t("dailyLog.complaintReason")}</label>
            <textarea
              className={styles.textarea}
              value={form.complaint}
              onChange={(e) => handleChange("complaint", e.target.value)}
              required
            />
          </div>
          <div className={styles.field}>
            <label className={styles.label}>{t("dailyLog.complaintType")}</label>
            <select
              className={styles.input}
              value={form.complaintType}
              onChange={(e) => handleChange("complaintType", e.target.value)}
              required
            >
              <option value="Fever">Fever</option>
              <option value="Injury">Injury</option>
              <option value="StomachPain">Stomach Pain</option>
              <option value="Headache">Headache</option>
              <option value="Allergy">Allergy</option>
              <option value="MedicationGiven">Medication Given</option>
              <option value="Other">Other</option>
            </select>
          </div>
          <div className={styles.field}>
            <label className={styles.label}>{t("dailyLog.treatmentGiven")}</label>
            <select
              className={styles.input}
              value={form.inventoryItemId}
              onChange={(e) => handleInventorySelect(e.target.value)}
            >
              <option value="">{t("dailyLog.noTreatment")}</option>
              {inventoryItems.map((item) => (
                <option key={item.id} value={item.id}>
                  {item.name} ({item.currentStock} {item.unit})
                </option>
              ))}
            </select>
          </div>
          <label className={styles.checkbox}>
            <input
              type="checkbox"
              checked={form.scheduleDoctorAppointment}
              onChange={(e) => handleChange("scheduleDoctorAppointment", e.target.checked)}
            />
            {t("dailyLog.scheduleDoctor")}
          </label>
          <div className={styles.modalActions}>
            <button type="button" className={styles.cancelBtn} onClick={onClose}>
              {t("dailyLog.cancel")}
            </button>
            <button type="submit" className={styles.submitBtn} disabled={creating}>
              {creating ? t("dailyLog.saving") : t("dailyLog.saveVisit")}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
