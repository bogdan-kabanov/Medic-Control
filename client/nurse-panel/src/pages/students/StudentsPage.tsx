import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { Eye, Pencil, Trash2 } from "lucide-react";
import {
  useGetStudentsQuery,
  useCreateStudentMutation,
  useUpdateStudentMutation,
  useDeleteStudentMutation,
} from "@/entities/student/api/studentsApi";
import type { Student, CreateStudent, UpdateStudent } from "@medcare/contracts";
import styles from "./StudentsPage.module.scss";

interface StudentFormData {
  firstName: string;
  lastName: string;
  grade: string;
  age: number;
  diseases: string[];
  medications: { name: string; dosage: string }[];
  counselor: { name: string; phone: string };
}

const emptyForm: StudentFormData = {
  firstName: "",
  lastName: "",
  grade: "",
  age: 6,
  diseases: [],
  medications: [{ name: "", dosage: "" }],
  counselor: { name: "", phone: "" },
};

export function StudentsPage() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [search, setSearch] = useState("");
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingStudent, setEditingStudent] = useState<Student | null>(null);
  const { data, isLoading, error } = useGetStudentsQuery({ search, page: 1, pageSize: 20 });
  const [createStudent, { isLoading: creating }] = useCreateStudentMutation();
  const [updateStudent, { isLoading: updating }] = useUpdateStudentMutation();
  const [deleteStudent] = useDeleteStudentMutation();

  const handleDelete = async (student: Student) => {
    if (!window.confirm(t("students.confirmDelete"))) return;
    try {
      await deleteStudent(student.id).unwrap();
    } catch (err) {
      alert(t("common.error"));
    }
  };

  const handleCreate = async (formData: StudentFormData) => {
    const body: CreateStudent = {
      firstName: formData.firstName,
      lastName: formData.lastName,
      grade: formData.grade,
      age: formData.age,
      diseases: formData.diseases as any,
      medications: formData.medications.filter((m) => m.name.trim() !== ""),
      counselor: formData.counselor,
    };
    try {
      await createStudent(body).unwrap();
      setShowAddModal(false);
    } catch (err) {
      alert(t("common.error"));
    }
  };

  const handleUpdate = async (formData: StudentFormData) => {
    if (!editingStudent) return;
    const body: UpdateStudent = {
      firstName: formData.firstName,
      lastName: formData.lastName,
      grade: formData.grade,
      age: formData.age,
      diseases: formData.diseases as any,
      medications: formData.medications.filter((m) => m.name.trim() !== ""),
      counselor: formData.counselor,
    };
    try {
      await updateStudent({ id: editingStudent.id, body }).unwrap();
      setEditingStudent(null);
    } catch (err) {
      alert(t("common.error"));
    }
  };

  return (
    <div className={styles.page}>
      <div className={styles.header}>
        <h1 className={styles.title}>{t("students.title")}</h1>
        <button className={styles.addBtn} onClick={() => setShowAddModal(true)}>
          {t("students.addStudent")}
        </button>
      </div>

      <div className={styles.filters}>
        <input
          className={styles.search}
          type="text"
          placeholder={t("students.searchPlaceholder")}
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>

      {isLoading && <p>{t("common.loading")}</p>}
      {error && <p className={styles.error}>{t("common.error")}</p>}

      {data && (
        <table className={styles.table}>
          <thead>
            <tr>
              <th>{t("students.name")}</th>
              <th>{t("students.grade")}</th>
              <th>{t("students.age")}</th>
              <th>{t("students.diseases")}</th>
              <th>{t("students.medications")}</th>
              <th>{t("students.counselor")}</th>
              <th>{t("students.actions")}</th>
            </tr>
          </thead>
          <tbody>
            {data.items.map((student) => (
              <tr key={student.id}>
                <td className={styles.nameCell}>
                  {student.firstName} {student.lastName}
                </td>
                <td>{student.grade}</td>
                <td>{student.age}</td>
                <td>
                  <div className={styles.badges}>
                    {student.diseases.map((d) => (
                      <span key={d} className={styles.diseaseBadge}>{d}</span>
                    ))}
                    {student.diseases.length === 0 && <span className={styles.none}>{t("students.none")}</span>}
                  </div>
                </td>
                <td>
                  <div className={styles.badges}>
                    {student.medications.map((m, i) => (
                      <span key={i} className={styles.medBadge}>{m.name}</span>
                    ))}
                    {student.medications.length === 0 && <span className={styles.none}>{t("students.none")}</span>}
                  </div>
                </td>
                <td>
                  <div className={styles.counselor}>
                    <span className={styles.counselorName}>{student.counselor.name}</span>
                    <span className={styles.counselorPhone}>{student.counselor.phone}</span>
                  </div>
                </td>
                <td>
                  <div className={styles.actions}>
                    <button className={styles.actionBtn} title={t("students.view")} onClick={() => navigate(`/students/${student.id}`)}>
                      <Eye size={16} />
                    </button>
                    <button
                      className={styles.actionBtn}
                      title={t("students.edit")}
                      onClick={() => setEditingStudent(student)}
                    >
                      <Pencil size={16} />
                    </button>
                    <button
                      className={`${styles.actionBtn} ${styles.deleteBtn}`}
                      title={t("students.delete")}
                      onClick={() => handleDelete(student)}
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}

      {showAddModal && (
        <StudentFormModal
          title={t("students.addStudentTitle")}
          saving={creating}
          onClose={() => setShowAddModal(false)}
          onSubmit={handleCreate}
        />
      )}

      {editingStudent && (
        <StudentFormModal
          title={t("students.editStudentTitle")}
          saving={updating}
          initialData={{
            firstName: editingStudent.firstName,
            lastName: editingStudent.lastName,
            grade: editingStudent.grade,
            age: editingStudent.age,
            diseases: editingStudent.diseases,
            medications: editingStudent.medications.length > 0
              ? editingStudent.medications
              : [{ name: "", dosage: "" }],
            counselor: editingStudent.counselor,
          }}
          onClose={() => setEditingStudent(null)}
          onSubmit={handleUpdate}
        />
      )}
    </div>
  );
}

function StudentFormModal({
  title,
  saving,
  initialData,
  onClose,
  onSubmit,
}: {
  title: string;
  saving: boolean;
  initialData?: StudentFormData;
  onClose: () => void;
  onSubmit: (data: StudentFormData) => Promise<void>;
}) {
  const { t } = useTranslation();
  const [form, setForm] = useState<StudentFormData>(initialData ?? emptyForm);
  const [diseasesInput, setDiseasesInput] = useState(form.diseases.join(", "));

  const handleChange = (field: keyof StudentFormData, value: any) => {
    setForm((prev) => ({ ...prev, [field]: value }));
  };

  const handleMedChange = (index: number, field: "name" | "dosage", value: string) => {
    const updated = [...form.medications];
    updated[index] = { ...updated[index], [field]: value };
    setForm((prev) => ({ ...prev, medications: updated }));
  };

  const addMedication = () => {
    setForm((prev) => ({ ...prev, medications: [...prev.medications, { name: "", dosage: "" }] }));
  };

  const removeMedication = (index: number) => {
    setForm((prev) => ({ ...prev, medications: prev.medications.filter((_, i) => i !== index) }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const diseases = diseasesInput
      .split(",")
      .map((d) => d.trim())
      .filter((d) => d.length > 0);
    onSubmit({ ...form, diseases });
  };

  return (
    <div className={styles.overlay} onClick={onClose}>
      <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
        <h2 className={styles.modalTitle}>{title}</h2>
        <form className={styles.form} onSubmit={handleSubmit}>
          <div className={styles.row}>
            <div className={styles.field}>
              <label className={styles.label}>{t("students.firstName")}</label>
              <input
                className={styles.input}
                value={form.firstName}
                onChange={(e) => handleChange("firstName", e.target.value)}
                required
              />
            </div>
            <div className={styles.field}>
              <label className={styles.label}>{t("students.lastName")}</label>
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
              <label className={styles.label}>{t("students.grade")}</label>
              <input
                className={styles.input}
                value={form.grade}
                onChange={(e) => handleChange("grade", e.target.value)}
                required
              />
            </div>
            <div className={styles.field}>
              <label className={styles.label}>{t("students.age")}</label>
              <input
                className={styles.input}
                type="number"
                min={5}
                max={21}
                value={form.age}
                onChange={(e) => handleChange("age", parseInt(e.target.value) || 6)}
                required
              />
            </div>
          </div>
          <div className={styles.field}>
            <label className={styles.label}>{t("students.diseases")}</label>
            <input
              className={styles.input}
              placeholder="e.g. Asthma, ADHD"
              value={diseasesInput}
              onChange={(e) => setDiseasesInput(e.target.value)}
            />
          </div>
          <div className={styles.field}>
            <label className={styles.label}>{t("students.medications")}</label>
            {form.medications.map((med, i) => (
              <div key={i} className={styles.row} style={{ marginBottom: 4 }}>
                <input
                  className={styles.input}
                  placeholder={t("students.medName")}
                  value={med.name}
                  onChange={(e) => handleMedChange(i, "name", e.target.value)}
                />
                <input
                  className={styles.input}
                  placeholder={t("students.medDosage")}
                  value={med.dosage}
                  onChange={(e) => handleMedChange(i, "dosage", e.target.value)}
                />
                {form.medications.length > 1 && (
                  <button type="button" onClick={() => removeMedication(i)} className={styles.removeBtn}>
                    ✕
                  </button>
                )}
              </div>
            ))}
            <button type="button" onClick={addMedication} className={styles.addMedBtn}>
              + {t("students.addMedication")}
            </button>
          </div>
          <div className={styles.field}>
            <label className={styles.label}>{t("students.counselor")}</label>
            <div className={styles.row}>
              <input
                className={styles.input}
                placeholder={t("students.counselorName")}
                value={form.counselor.name}
                onChange={(e) => handleChange("counselor", { ...form.counselor, name: e.target.value })}
                required
              />
              <input
                className={styles.input}
                placeholder={t("students.counselorPhone")}
                value={form.counselor.phone}
                onChange={(e) => handleChange("counselor", { ...form.counselor, phone: e.target.value })}
                required
              />
            </div>
          </div>
          <div className={styles.modalActions}>
            <button type="button" className={styles.cancelBtn} onClick={onClose}>
              {t("common.cancel")}
            </button>
            <button type="submit" className={styles.submitBtn} disabled={saving}>
              {saving ? t("common.loading") : t("common.save")}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
