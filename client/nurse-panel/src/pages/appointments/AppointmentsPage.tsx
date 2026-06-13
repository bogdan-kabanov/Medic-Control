import { useState } from "react";
import { useTranslation } from "react-i18next";
import {
  useGetAppointmentsQuery,
  useCreateAppointmentMutation,
  useApproveAppointmentMutation,
  useCancelAppointmentMutation,
  useCompleteAppointmentMutation,
} from "@/entities/appointment/api/appointmentsApi";
import { useGetStudentsQuery } from "@/entities/student/api/studentsApi";
import type { Appointment, CreateAppointment } from "@/entities/appointment/api/appointmentsApi";
import styles from "./AppointmentsPage.module.scss";

const TABS = ["All", "Pending", "Approved", "Completed"] as const;

export function AppointmentsPage() {
  const { t } = useTranslation();
  const [activeTab, setActiveTab] = useState<string>("All");
  const [showModal, setShowModal] = useState(false);

  const queryParam = activeTab === "All" ? {} : { status: activeTab };
  const { data: appointments = [], isLoading, error } = useGetAppointmentsQuery(queryParam);
  const [createAppointment, { isLoading: creating }] = useCreateAppointmentMutation();
  const [approve] = useApproveAppointmentMutation();
  const [cancel] = useCancelAppointmentMutation();
  const [complete] = useCompleteAppointmentMutation();

  const getTabLabel = (tab: string): string => {
    switch (tab) {
      case "All": return t("appointments.all");
      case "Pending": return t("appointments.pending");
      case "Approved": return t("appointments.approved");
      case "Completed": return t("appointments.completed");
      default: return tab;
    }
  };

  const getPriorityClass = (priority: Appointment["priority"]) => {
    switch (priority) {
      case "Emergency": return styles.priorityEmergency ?? "";
      case "High": return styles.priorityHigh ?? "";
      case "Medium": return styles.priorityMedium ?? "";
      case "Low": return styles.priorityLow ?? "";
      default: return "";
    }
  };

  const getStatusClass = (status: Appointment["status"]) => {
    switch (status) {
      case "Pending": return styles.statusPending ?? "";
      case "Approved": return styles.statusApproved ?? "";
      case "Completed": return styles.statusCompleted ?? "";
      case "Cancelled": return styles.statusCancelled ?? "";
      default: return "";
    }
  };

  const getDoctorLabel = (doctorType: string): string => {
    return t(`appointments.doctors.${doctorType}`, { defaultValue: doctorType });
  };

  return (
    <div className={styles.page}>
      <div className={styles.header}>
        <h1 className={styles.title}>{t("appointments.title")}</h1>
        <button className={styles.addBtn} onClick={() => setShowModal(true)}>
          {t("appointments.newAppointment")}
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

      {!isLoading && !error && appointments.length === 0 && (
        <div className={styles.empty}>{t("appointments.noAppointments")}</div>
      )}

      {!isLoading && !error && appointments.length > 0 && (
        <div className={styles.grid}>
          {appointments.map((appt) => (
            <div key={appt.id} className={styles.card}>
              <div className={styles.cardTop}>
                <span className={styles.studentName}>
                  {appt.studentName || t("appointments.unknownStudent")}
                </span>
                <span className={`${styles.priority} ${getPriorityClass(appt.priority)}`}>
                  {appt.priority}
                </span>
              </div>
              <div className={styles.doctorType}>{getDoctorLabel(appt.doctorType)}</div>
              <div className={styles.reason}>{appt.reason}</div>
              <div className={styles.dateTime}>
                {new Date(appt.dateTime).toLocaleString()}
              </div>
              <span className={`${styles.status} ${getStatusClass(appt.status)}`}>
                {appt.status}
              </span>
              <div className={styles.cardActions}>
                {(appt.status === "Pending" || appt.status === "Approved") && (
                  <>
                    <button className={styles.doneBtn} onClick={() => complete(appt.id)}>
                      {t("appointments.done")}
                    </button>
                    <button className={styles.cancelBtn} onClick={() => cancel(appt.id)}>
                      {t("appointments.cancel")}
                    </button>
                  </>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {showModal && (
        <NewAppointmentModal
          creating={creating}
          onClose={() => setShowModal(false)}
          onSubmit={async (data) => {
            try {
              await createAppointment(data).unwrap();
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

function NewAppointmentModal({
  onClose,
  onSubmit,
  creating,
}: {
  onClose: () => void;
  onSubmit: (data: CreateAppointment) => Promise<void>;
  creating: boolean;
}) {
  const { t } = useTranslation();
  const { data: studentsData } = useGetStudentsQuery({ page: 1, pageSize: 100 });
  const students = studentsData?.items ?? [];

  const [form, setForm] = useState({
    studentId: "",
    doctorType: "FamilyDoctor",
    reason: "",
    date: new Date().toISOString().slice(0, 10),
    time: "09:00",
    priority: "Medium" as CreateAppointment["priority"],
  });

  const handleChange = (field: string, value: string) => {
    setForm((prev) => ({ ...prev, [field]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const dateTime = new Date(`${form.date}T${form.time}:00`).toISOString();
    const payload: CreateAppointment = {
      studentId: form.studentId,
      doctorType: form.doctorType,
      reason: form.reason,
      dateTime,
      priority: form.priority,
    };
    try {
      await onSubmit(payload);
    } catch (err) {
      alert(t("common.error"));
    }
  };

  return (
    <div className={styles.overlay} onClick={onClose}>
      <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
        <h2 className={styles.modalTitle}>{t("appointments.modalTitle")}</h2>
        <form className={styles.form} onSubmit={handleSubmit}>
          <div className={styles.field}>
            <label className={styles.label}>{t("appointments.studentName")}</label>
            <select
              className={styles.select}
              value={form.studentId}
              onChange={(e) => handleChange("studentId", e.target.value)}
              required
            >
              <option value="">{t("appointments.selectStudent")}</option>
              {students.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.firstName} {s.lastName} — {s.grade}
                </option>
              ))}
            </select>
          </div>
          <div className={styles.field}>
            <label className={styles.label}>{t("appointments.doctorType")}</label>
            <select
              className={styles.select}
              value={form.doctorType}
              onChange={(e) => handleChange("doctorType", e.target.value)}
              required
            >
              <option value="FamilyDoctor">Family Doctor</option>
              <option value="Pediatrician">Pediatrician</option>
              <option value="Neurologist">Neurologist</option>
              <option value="Gastroenterologist">Gastroenterologist</option>
              <option value="Allergist">Allergist</option>
              <option value="Dermatologist">Dermatologist</option>
              <option value="Ophthalmologist">Ophthalmologist</option>
            </select>
          </div>
          <div className={styles.field}>
            <label className={styles.label}>{t("appointments.reason")}</label>
            <textarea
              className={styles.textarea}
              value={form.reason}
              onChange={(e) => handleChange("reason", e.target.value)}
              required
            />
          </div>
          <div className={styles.row}>
            <div className={styles.field}>
              <label className={styles.label}>{t("appointments.date")}</label>
              <input
                className={styles.input}
                type="date"
                value={form.date}
                onChange={(e) => handleChange("date", e.target.value)}
                required
              />
            </div>
            <div className={styles.field}>
              <label className={styles.label}>{t("appointments.time")}</label>
              <input
                className={styles.input}
                type="time"
                value={form.time}
                onChange={(e) => handleChange("time", e.target.value)}
                required
              />
            </div>
          </div>
          <div className={styles.field}>
            <label className={styles.label}>{t("appointments.priority")}</label>
            <select
              className={styles.select}
              value={form.priority}
              onChange={(e) => handleChange("priority", e.target.value as CreateAppointment["priority"])}
            >
              <option value="Emergency">Emergency</option>
              <option value="High">High</option>
              <option value="Medium">Medium</option>
              <option value="Low">Low</option>
            </select>
          </div>
          <div className={styles.modalActions}>
            <button type="button" className={styles.modalCancelBtn} onClick={onClose}>
              {t("common.cancel")}
            </button>
            <button type="submit" className={styles.submitBtn} disabled={creating}>
              {creating ? t("appointments.creating") : t("appointments.create")}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
