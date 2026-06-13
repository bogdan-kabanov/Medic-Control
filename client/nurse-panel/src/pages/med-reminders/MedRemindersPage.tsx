import { useState } from "react";
import { useTranslation } from "react-i18next";
import {
  useGetRemindersQuery,
  useCreateCourseMutation,
  useMarkReminderDoneMutation,
} from "@/entities/reminder/api/remindersApi";
import { useGetStudentsQuery } from "@/entities/student/api/studentsApi";
import { useGetInventoryQuery } from "@/entities/inventory/api/inventoryApi";
import type { Reminder, CreateReminder } from "@/entities/reminder/api/remindersApi";
import styles from "./MedRemindersPage.module.scss";

const TABS = ["All", "Pending", "Done"] as const;

export function MedRemindersPage() {
  const { t } = useTranslation();
  const [activeTab, setActiveTab] = useState<string>("All");
  const [showModal, setShowModal] = useState(false);
  const [expandedCourses, setExpandedCourses] = useState<Set<string>>(new Set());

  const queryParam = activeTab === "All" ? {} : { status: activeTab };
  const { data: reminders = [], isLoading, error } = useGetRemindersQuery(queryParam);
  const [createCourse, { isLoading: creating }] = useCreateCourseMutation();
  const [markDone] = useMarkReminderDoneMutation();

  const getTabLabel = (tab: string): string => {
    switch (tab) {
      case "All": return t("reminders.all");
      case "Pending": return t("reminders.pending");
      case "Done": return t("reminders.done");
      default: return tab;
    }
  };

  const getBadgeClass = (status: Reminder["status"]) => {
    switch (status) {
      case "Done": return styles.badgeDone ?? "";
      case "Pending": return styles.badgePending ?? "";
      case "Missed": return styles.badgeMissed ?? "";
      case "EarlyIntake": return styles.badgeEarly ?? "";
      default: return "";
    }
  };

  const getStatusLabel = (status: Reminder["status"]) => {
    switch (status) {
      case "Done": return t("reminders.statusDone");
      case "Pending": return t("reminders.statusPending");
      case "Missed": return t("reminders.statusMissed");
      case "EarlyIntake": return t("reminders.statusEarly");
      default: return status;
    }
  };

  return (
    <div className={styles.page}>
      <div className={styles.header}>
        <h1 className={styles.title}>{t("reminders.title")}</h1>
        <button className={styles.addBtn} onClick={() => setShowModal(true)}>
          {t("reminders.addReminder")}
        </button>
      </div>

      <div className={styles.tabs}>
        {TABS.map((tab) => (
          <button
            key={tab}
            className={`${styles.tab} ${activeTab === tab ? styles.tabActive : ""}`}
            onClick={() => setActiveTab(tab)}
          >
            {getTabLabel(tab)}
          </button>
        ))}
      </div>

      {isLoading && <div className={styles.loading}>{t("common.loading")}</div>}
      {error && <div className={styles.error}>{t("common.error")}</div>}

      {!isLoading && !error && reminders.length === 0 && (
        <div className={styles.empty}>{t("reminders.noReminders")}</div>
      )}

      {!isLoading && !error && reminders.length > 0 && (
        <table className={styles.table}>
          <thead>
            <tr>
              <th>{t("reminders.student")}</th>
              <th>{t("reminders.medication")}</th>
              <th>{t("reminders.dosage")}</th>
              <th>{t("reminders.dateTime")}</th>
              <th>{t("reminders.notes")}</th>
              <th>{t("reminders.status")}</th>
              <th>{t("reminders.action")}</th>
            </tr>
          </thead>
          <tbody>
            {(() => {
              // Group by courseId
              const groups = new Map<string, { courseName: string; items: typeof reminders }>();
              const ungrouped: typeof reminders = [];

              reminders.forEach((r) => {
                if (r.courseId) {
                  if (!groups.has(r.courseId)) {
                    groups.set(r.courseId, { courseName: r.courseName || r.medication, items: [] });
                  }
                  groups.get(r.courseId)!.items.push(r);
                } else {
                  ungrouped.push(r);
                }
              });

              const rows: React.ReactNode[] = [];

              // Render grouped courses
              groups.forEach((group, courseId) => {
                const pending = group.items.filter((i) => i.status === "Pending").length;
                const done = group.items.filter((i) => i.status === "Done" || i.status === "EarlyIntake").length;
                const total = group.items.length;
                const isExpanded = expandedCourses.has(courseId);

                rows.push(
                  <tr
                    key={`course-${courseId}`}
                    style={{ background: "#f0f9ff", cursor: "pointer" }}
                    onClick={() => {
                      setExpandedCourses((prev) => {
                        const next = new Set(prev);
                        if (next.has(courseId)) next.delete(courseId);
                        else next.add(courseId);
                        return next;
                      });
                    }}
                  >
                    <td colSpan={4} style={{ fontWeight: 600, color: "#1d4ed8" }}>
                      <span style={{ marginRight: 6 }}>{isExpanded ? "▼" : "▶"}</span>
                      📦 {group.courseName} ({done}/{total} {t("reminders.completed")})
                    </td>
                    <td colSpan={2}>
                      <span className={`${styles.badge} ${pending > 0 ? styles.badgePending : styles.badgeDone}`}>
                        {pending > 0 ? `${pending} ${t("reminders.pending")}` : t("reminders.allDone")}
                      </span>
                    </td>
                    <td></td>
                  </tr>
                );

                if (isExpanded) {
                  group.items.forEach((reminder) => {
                    rows.push(
                      <tr key={reminder.id} style={{ background: "#fafcff" }}>
                        <td style={{ paddingLeft: 32 }}>{reminder.studentName}</td>
                        <td>{reminder.medication}</td>
                        <td>{reminder.dosage}</td>
                        <td>{new Date(reminder.dateTime).toLocaleString()}</td>
                        <td>{reminder.notes || "—"}</td>
                        <td>
                          <span className={`${styles.badge} ${getBadgeClass(reminder.status)}`}>
                            {getStatusLabel(reminder.status)}
                          </span>
                        </td>
                        <td>
                          {reminder.status === "Pending" && (
                            <button className={styles.doneBtn} onClick={(e) => { e.stopPropagation(); markDone(reminder.id); }}>
                              {t("reminders.markDone")}
                            </button>
                          )}
                        </td>
                      </tr>
                    );
                  });
                }
              });

              // Render ungrouped (single reminders)
              ungrouped.forEach((reminder) => {
                rows.push(
                  <tr key={reminder.id}>
                    <td>{reminder.studentName}</td>
                    <td>{reminder.medication}</td>
                    <td>{reminder.dosage}</td>
                    <td>{new Date(reminder.dateTime).toLocaleString()}</td>
                    <td>{reminder.notes || "—"}</td>
                    <td>
                      <span className={`${styles.badge} ${getBadgeClass(reminder.status)}`}>
                        {getStatusLabel(reminder.status)}
                      </span>
                    </td>
                    <td>
                      {reminder.status === "Pending" && (
                        <button className={styles.doneBtn} onClick={() => markDone(reminder.id)}>
                          {t("reminders.markDone")}
                        </button>
                      )}
                    </td>
                  </tr>
                );
              });

              return rows;
            })()}
          </tbody>
        </table>
      )}

      {showModal && (
        <AddReminderModal
          creating={creating}
          onClose={() => setShowModal(false)}
          onSubmit={async (data) => {
            try {
              await createCourse(data).unwrap();
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

function AddReminderModal({
  onClose,
  onSubmit,
  creating,
}: {
  onClose: () => void;
  onSubmit: (data: CreateReminder) => Promise<void>;
  creating: boolean;
}) {
  const { t } = useTranslation();
  const { data: studentsData } = useGetStudentsQuery({ page: 1, pageSize: 100 });
  const { data: inventoryItems = [] } = useGetInventoryQuery({});
  const students = studentsData?.items ?? [];

  const [form, setForm] = useState({
    studentId: "",
    medication: "",
    dosageAmount: "1",
    dosageUnit: "Tablets",
    startDate: new Date().toISOString().slice(0, 10),
    durationDays: "7",
    times: ["08:00"],
    notes: "",
  });
  const [medSearch, setMedSearch] = useState("");
  const [showMedDropdown, setShowMedDropdown] = useState(false);

  const filteredMeds = inventoryItems.filter((item) =>
    item.name.toLowerCase().includes(medSearch.toLowerCase())
  );

  const handleChange = (field: string, value: string) => {
    setForm((prev) => ({ ...prev, [field]: value }));
  };

  const handleSelectMed = (item: { name: string; unit: string }) => {
    setForm((prev) => ({ ...prev, medication: item.name, dosageUnit: item.unit }));
    setMedSearch(item.name);
    setShowMedDropdown(false);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const dosage = `${form.dosageAmount} ${form.dosageUnit}`;
    await onSubmit({
      studentId: form.studentId,
      medication: form.medication || medSearch,
      dosage,
      startDate: form.startDate,
      durationDays: Number(form.durationDays),
      times: form.times.filter((t) => t.trim() !== ""),
      notes: form.notes,
    });
  };

  return (
    <div className={styles.overlay} onClick={onClose}>
      <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
        <h2 className={styles.modalTitle}>{t("reminders.modalTitle")}</h2>
        <form className={styles.form} onSubmit={handleSubmit}>
          <div className={styles.field}>
            <label className={styles.label}>{t("reminders.student")}</label>
            <select
              className={styles.input}
              value={form.studentId}
              onChange={(e) => handleChange("studentId", e.target.value)}
              required
            >
              <option value="">{t("reminders.selectStudent")}</option>
              {students.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.firstName} {s.lastName} — {s.grade}
                </option>
              ))}
            </select>
          </div>
          <div className={styles.field}>
            <label className={styles.label}>{t("reminders.medication")}</label>
            <div style={{ position: "relative" }}>
              <input
                className={styles.input}
                value={medSearch}
                onChange={(e) => { setMedSearch(e.target.value); setShowMedDropdown(true); }}
                onFocus={() => setShowMedDropdown(true)}
                placeholder={t("reminders.searchMedication")}
                required
              />
              {showMedDropdown && filteredMeds.length > 0 && (
                <div style={{ position: "absolute", top: "100%", left: 0, right: 0, background: "#fff", border: "1px solid #e2e8f0", borderRadius: 8, boxShadow: "0 4px 12px rgba(0,0,0,0.1)", zIndex: 10, maxHeight: 160, overflowY: "auto" }}>
                  {filteredMeds.map((item) => (
                    <div
                      key={item.id}
                      style={{ padding: "8px 12px", cursor: "pointer", fontSize: 14, borderBottom: "1px solid #f1f5f9" }}
                      onClick={() => handleSelectMed(item)}
                      onMouseEnter={(e) => (e.currentTarget.style.background = "#f8fafc")}
                      onMouseLeave={(e) => (e.currentTarget.style.background = "#fff")}
                    >
                      {item.name} <span style={{ color: "#94a3b8", fontSize: 12 }}>({item.currentStock} {item.unit})</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
          <div className={styles.row}>
            <div className={styles.field}>
              <label className={styles.label}>{t("reminders.dosageAmount")}</label>
              <input
                className={styles.input}
                type="number"
                min="1"
                value={form.dosageAmount}
                onChange={(e) => handleChange("dosageAmount", e.target.value)}
                required
              />
            </div>
            <div className={styles.field}>
              <label className={styles.label}>{t("reminders.dosageUnit")}</label>
              <select
                className={styles.input}
                value={form.dosageUnit}
                onChange={(e) => handleChange("dosageUnit", e.target.value)}
              >
                <option value="Tablets">{t("inventory.units.Tablets")}</option>
                <option value="Puffs">{t("inventory.units.Puffs")}</option>
                <option value="ML">{t("inventory.units.ML")}</option>
                <option value="Pieces">{t("inventory.units.Pieces")}</option>
              </select>
            </div>
          </div>
          <div className={styles.row}>
            <div className={styles.field}>
              <label className={styles.label}>{t("reminders.startDate")}</label>
              <input
                className={styles.input}
                type="date"
                value={form.startDate}
                onChange={(e) => handleChange("startDate", e.target.value)}
                required
              />
            </div>
            <div className={styles.field}>
              <label className={styles.label}>{t("reminders.durationDays")}</label>
              <input
                className={styles.input}
                type="number"
                min="1"
                max="90"
                value={form.durationDays}
                onChange={(e) => handleChange("durationDays", e.target.value)}
                required
              />
            </div>
          </div>
          <div className={styles.field}>
            <label className={styles.label}>{t("reminders.intakeTimes")}</label>
            <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
              {form.times.map((time, idx) => (
                <div key={idx} style={{ display: "flex", gap: 8, alignItems: "center" }}>
                  <input
                    className={styles.input}
                    type="time"
                    value={time}
                    onChange={(e) => {
                      const newTimes = [...form.times];
                      newTimes[idx] = e.target.value;
                      setForm((prev) => ({ ...prev, times: newTimes }));
                    }}
                    required
                    style={{ flex: 1 }}
                  />
                  {form.times.length > 1 && (
                    <button
                      type="button"
                      style={{ padding: "4px 8px", fontSize: 14, cursor: "pointer", border: "1px solid #e2e8f0", borderRadius: 6, background: "#fef2f2", color: "#ef4444" }}
                      onClick={() => setForm((prev) => ({ ...prev, times: prev.times.filter((_, i) => i !== idx) }))}
                    >
                      ✕
                    </button>
                  )}
                </div>
              ))}
              <button
                type="button"
                style={{ alignSelf: "flex-start", fontSize: 13, color: "#2563eb", cursor: "pointer", background: "none", border: "none", fontWeight: 500 }}
                onClick={() => setForm((prev) => ({ ...prev, times: [...prev.times, "12:00"] }))}
              >
                + {t("reminders.addTime")}
              </button>
            </div>
            <p style={{ fontSize: 11, color: "#94a3b8", marginTop: 4 }}>
              {t("reminders.totalReminders")}: {Number(form.durationDays) * form.times.length}
            </p>
          </div>
          <div className={styles.field}>
            <label className={styles.label}>{t("reminders.notesOptional")}</label>
            <textarea
              className={styles.textarea}
              value={form.notes}
              onChange={(e) => handleChange("notes", e.target.value)}
            />
          </div>
          <div className={styles.modalActions}>
            <button type="button" className={styles.cancelBtn} onClick={onClose}>
              {t("common.cancel")}
            </button>
            <button type="submit" className={styles.submitBtn} disabled={creating}>
              {creating ? t("reminders.adding") : t("reminders.add")}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
