import type { CreateAppointment } from "@medcare/contracts";
import { ok, err, type Result } from "@medcare/contracts";
import type { AppointmentRepository, AppointmentEntity } from "../repositories/appointment.repository.js";
import { publishEvent } from "../rabbitmq.js";

export interface AppointmentResponse {
  id: string;
  studentId: string;
  studentName: string;
  doctorType: string;
  reason: string;
  dateTime: string;
  priority: string;
  status: string;
  createdAt: string;
}

function mapToResponse(entity: AppointmentEntity): AppointmentResponse {
  return {
    id: entity.id,
    studentId: entity.studentId,
    studentName: entity.studentName,
    doctorType: entity.doctorType,
    reason: entity.reason,
    dateTime: entity.dateTime.toISOString(),
    priority: entity.priority,
    status: entity.status,
    createdAt: entity.createdAt.toISOString(),
  };
}

export class AppointmentService {
  constructor(private appointmentRepo: AppointmentRepository) {}

  async getAppointments(filters: { status?: string | undefined; page: number; pageSize: number }) {
    const { items, total } = await this.appointmentRepo.findAll(filters);
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

  async getAppointment(id: string): Promise<Result<AppointmentResponse>> {
    const appointment = await this.appointmentRepo.findById(id);
    if (!appointment) {
      return err({ code: "NOT_FOUND", message: "Not found", statusCode: 404 });
    }
    return ok(mapToResponse(appointment));
  }

  async getMyAppointments(studentId: string): Promise<AppointmentResponse[]> {
    const items = await this.appointmentRepo.findByStudentId(studentId);
    return items.map(mapToResponse);
  }

  async createAppointment(data: CreateAppointment): Promise<AppointmentResponse> {
    // Resolve student name from students-service
    let studentName = "";
    try {
      const res = await fetch(`http://localhost:4002/api/v1/students/${data.studentId}`);
      if (res.ok) {
        const student = await res.json();
        studentName = `${student.firstName} ${student.lastName}`;
      }
    } catch {
      // If students-service unavailable, leave empty
    }

    const entity = await this.appointmentRepo.create({
      studentId: data.studentId,
      studentName,
      doctorType: data.doctorType,
      reason: data.reason,
      dateTime: new Date(data.dateTime),
      priority: data.priority,
      status: "Pending",
    });
    return mapToResponse(entity);
  }

  async approve(id: string): Promise<Result<AppointmentResponse>> {
    const appointment = await this.appointmentRepo.findById(id);
    if (!appointment) {
      return err({ code: "NOT_FOUND", message: "Not found", statusCode: 404 });
    }
    if (appointment.status !== "Pending") {
      return err({ code: "INVALID_STATUS", message: "Can only approve Pending appointments", statusCode: 400 });
    }

    const updated = await this.appointmentRepo.updateStatus(id, "Approved");

    await publishEvent("appointment.status.changed", {
      type: "appointment.status.changed",
      appointmentId: id,
      studentId: updated.studentId,
      previousStatus: "Pending",
      newStatus: "Approved",
    });

    return ok(mapToResponse(updated));
  }

  async cancel(id: string): Promise<Result<AppointmentResponse>> {
    const appointment = await this.appointmentRepo.findById(id);
    if (!appointment) {
      return err({ code: "NOT_FOUND", message: "Not found", statusCode: 404 });
    }

    const updated = await this.appointmentRepo.updateStatus(id, "Cancelled");

    await publishEvent("appointment.status.changed", {
      type: "appointment.status.changed",
      appointmentId: id,
      studentId: updated.studentId,
      previousStatus: appointment.status,
      newStatus: "Cancelled",
    });

    return ok(mapToResponse(updated));
  }

  async complete(id: string): Promise<Result<AppointmentResponse>> {
    const appointment = await this.appointmentRepo.findById(id);
    if (!appointment) {
      return err({ code: "NOT_FOUND", message: "Not found", statusCode: 404 });
    }
    if (appointment.status !== "Pending" && appointment.status !== "Approved") {
      return err({ code: "INVALID_STATUS", message: "Can only complete Pending or Approved appointments", statusCode: 400 });
    }

    const updated = await this.appointmentRepo.updateStatus(id, "Completed");

    await publishEvent("appointment.status.changed", {
      type: "appointment.status.changed",
      appointmentId: id,
      studentId: updated.studentId,
      previousStatus: "Approved",
      newStatus: "Completed",
    });

    return ok(mapToResponse(updated));
  }

  async createFromReferral(data: {
    studentId: string;
    studentName: string;
    reason: string;
    complaintType: string;
  }): Promise<void> {
    let priority = "Medium";
    if (data.complaintType === "Fever" || data.complaintType === "Injury") {
      priority = "High";
    }

    await this.appointmentRepo.create({
      studentId: data.studentId,
      studentName: data.studentName,
      doctorType: "FamilyDoctor",
      reason: data.reason,
      dateTime: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000),
      priority,
      status: "Pending",
    });
  }
}
