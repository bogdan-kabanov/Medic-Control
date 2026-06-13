import crypto from "node:crypto";
import type { CreateReminder, ConfirmReminder } from "@medcare/contracts";
import { ok, err, type Result } from "@medcare/contracts";
import type { ReminderRepository, ReminderEntity } from "../repositories/reminder.repository.js";
import type { StatusLogRepository } from "../repositories/status-log.repository.js";
import type { Env } from "../config.js";

export interface ReminderResponse {
  id: string;
  studentId: string;
  studentName: string;
  medication: string;
  dosage: string;
  dateTime: string;
  notes: string;
  status: string;
  confirmedAt: string | null;
  confirmedBy: string | null;
  courseId: string | null;
  courseName: string | null;
}

function mapToResponse(entity: ReminderEntity): ReminderResponse {
  return {
    id: entity.id,
    studentId: entity.studentId,
    studentName: entity.studentName,
    medication: entity.medication,
    dosage: entity.dosage,
    dateTime: entity.dateTime.toISOString(),
    notes: entity.notes,
    status: entity.status,
    confirmedAt: entity.confirmedAt?.toISOString() ?? null,
    confirmedBy: entity.confirmedBy ?? null,
    courseId: entity.courseId ?? null,
    courseName: entity.courseName ?? null,
  };
}

export class ReminderService {
  constructor(
    private reminderRepo: ReminderRepository,
    private statusLogRepo: StatusLogRepository,
    private config: Env
  ) {}

  async getReminders(filters: { status?: string | undefined; date?: string | undefined; page: number; pageSize: number }) {
    const { items, total } = await this.reminderRepo.findAll(filters);
    return {
      items: items.map(mapToResponse),
      meta: {
        total,
        page: filters.page,
        pageSize: filters.pageSize,
        totalPages: Math.ceil(total / filters.pageSize),
      },
    };
  }

  async getMyReminders(studentId: string): Promise<ReminderResponse[]> {
    const items = await this.reminderRepo.findByStudentId(studentId);

    // Enrich with course progress
    const courseProgressCache = new Map<string, { total: number; done: number }>();
    const result: ReminderResponse[] = [];

    for (const item of items) {
      const response = mapToResponse(item);

      if (item.courseId) {
        if (!courseProgressCache.has(item.courseId)) {
          const progress = await this.reminderRepo.findCourseProgress(studentId, item.courseId);
          courseProgressCache.set(item.courseId, progress);
        }
        const progress = courseProgressCache.get(item.courseId)!;
        (response as any).courseProgress = progress;
      }

      result.push(response);
    }

    return result;
  }

  async createReminder(data: CreateReminder): Promise<ReminderResponse> {
    // Resolve student name from students-service
    let studentName = "";
    try {
      const res = await fetch(`http://localhost:4002/api/v1/students/${data.studentId}`);
      if (res.ok) {
        const student = await res.json();
        studentName = `${student.firstName} ${student.lastName}`;
      }
    } catch {
      // If students-service is unavailable, leave name empty
    }

    const entity = await this.reminderRepo.create({
      studentId: data.studentId,
      studentName,
      medication: data.medication,
      dosage: data.dosage,
      dateTime: new Date(data.dateTime),
      notes: data.notes,
      status: "Pending",
    });
    return mapToResponse(entity);
  }

  async createCourse(data: {
    studentId: string;
    medication: string;
    dosage: string;
    startDate: string;
    durationDays: number;
    times: string[];
    notes: string;
  }): Promise<{ courseId: string; count: number }> {
    const courseId = crypto.randomUUID();
    const courseName = `${data.medication} — ${data.durationDays}d × ${data.times.length}/day`;

    // Resolve student name
    let studentName = "";
    try {
      const res = await fetch(`http://localhost:4002/api/v1/students/${data.studentId}`);
      if (res.ok) {
        const student = await res.json();
        studentName = `${student.firstName} ${student.lastName}`;
      }
    } catch {}

    let count = 0;
    for (let day = 0; day < data.durationDays; day++) {
      for (const time of data.times) {
        const date = new Date(data.startDate);
        date.setDate(date.getDate() + day);
        const [hours, minutes] = time.split(":");
        date.setHours(Number(hours), Number(minutes), 0, 0);

        await this.reminderRepo.create({
          studentId: data.studentId,
          studentName,
          medication: data.medication,
          dosage: data.dosage,
          dateTime: date,
          notes: data.notes,
          status: "Pending",
          courseId,
          courseName,
        });
        count++;
      }
    }

    return { courseId, count };
  }

  async markDone(id: string): Promise<Result<ReminderResponse>> {
    const reminder = await this.reminderRepo.findById(id);
    if (!reminder) {
      return err({ code: "NOT_FOUND", message: "Not found", statusCode: 404 });
    }

    const previousStatus = reminder.status;
    const updated = await this.reminderRepo.updateStatus(id, "Done", new Date(), "nurse");

    await this.statusLogRepo.create({
      reminderId: id,
      previousStatus,
      newStatus: "Done",
      changedBy: "nurse",
    });

    return ok(mapToResponse(updated));
  }

  async confirmIntake(id: string, data: ConfirmReminder): Promise<Result<ReminderResponse>> {
    const reminder = await this.reminderRepo.findById(id);
    if (!reminder) {
      return err({ code: "NOT_FOUND", message: "Not found", statusCode: 404 });
    }

    const now = new Date();
    const windowStart = new Date(reminder.dateTime.getTime() - this.config.INTAKE_WINDOW_BEFORE_MIN * 60 * 1000);

    let newStatus: "Done" | "EarlyIntake";
    if (now < windowStart) {
      // Taken before the acceptable window (more than INTAKE_WINDOW_BEFORE_MIN minutes early)
      newStatus = "EarlyIntake";
    } else {
      // Within window or after — normal intake
      newStatus = "Done";
    }

    const previousStatus = reminder.status;
    const updated = await this.reminderRepo.updateStatus(id, newStatus, now, data.confirmedBy);

    await this.statusLogRepo.create({
      reminderId: id,
      previousStatus,
      newStatus,
      changedBy: data.confirmedBy,
    });

    return ok(mapToResponse(updated));
  }
}
