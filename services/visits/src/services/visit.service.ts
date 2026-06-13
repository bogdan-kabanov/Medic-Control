import type { CreateVisit } from "@medcare/contracts";
import { ok, err, type Result } from "@medcare/contracts";
import type { VisitRepository, VisitEntity } from "../repositories/visit.repository.js";
import { publishEvent } from "../rabbitmq.js";

export interface VisitResponse {
  id: string;
  studentId: string | null;
  firstName: string;
  lastName: string;
  grade: string;
  arrivalTime: string;
  complaint: string;
  complaintType: string;
  treatmentGiven: string;
  scheduledDoctorAppointment: boolean;
  createdAt: string;
}

function mapToResponse(entity: VisitEntity): VisitResponse {
  return {
    id: entity.id,
    studentId: entity.studentId,
    firstName: entity.firstName,
    lastName: entity.lastName,
    grade: entity.grade,
    arrivalTime: entity.arrivalTime,
    complaint: entity.complaint,
    complaintType: entity.complaintType,
    treatmentGiven: entity.treatmentGiven,
    scheduledDoctorAppointment: entity.scheduledDoctorAppointment,
    createdAt: entity.createdAt.toISOString(),
  };
}

export class VisitService {
  constructor(private visitRepo: VisitRepository) {}

  async getVisits(filters: { date?: string | undefined; search?: string | undefined; page: number; pageSize: number }) {
    const { items, total } = await this.visitRepo.findAll(filters);
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

  async getVisit(id: string): Promise<Result<VisitResponse>> {
    const visit = await this.visitRepo.findById(id);
    if (!visit) {
      return err({ code: "NOT_FOUND", message: "Visit not found", statusCode: 404 });
    }
    return ok(mapToResponse(visit));
  }

  async getMyVisits(studentId: string): Promise<VisitResponse[]> {
    const visits = await this.visitRepo.findByStudentId(studentId);
    return visits.map(mapToResponse);
  }

  async createVisit(data: CreateVisit): Promise<VisitResponse> {
    const visit = await this.visitRepo.create({
      studentId: data.studentId,
      firstName: data.firstName,
      lastName: data.lastName,
      grade: data.grade,
      arrivalTime: data.arrivalTime,
      complaint: data.complaint,
      complaintType: data.complaintType,
      treatmentGiven: data.treatmentGiven,
      scheduledDoctorAppointment: data.scheduleDoctorAppointment,
    });

    const response = mapToResponse(visit);

    // Publish visit.created event
    await publishEvent("visit.created", {
      type: "visit.created",
      visitId: visit.id,
      studentId: visit.studentId,
      complaintType: visit.complaintType,
      date: visit.createdAt.toISOString().split("T")[0],
    });

    // If referral requested, publish referral event
    if (data.scheduleDoctorAppointment && data.studentId) {
      await publishEvent("visit.referral.created", {
        type: "visit.referral.created",
        visitId: visit.id,
        studentId: data.studentId,
        studentName: `${data.firstName} ${data.lastName}`,
        reason: data.complaint,
        complaintType: data.complaintType,
      });
    }

    // After visit creation, if inventory item was specified, deduct by ID
    if ((data as any).inventoryItemId) {
      try {
        const itemRes = await fetch(`http://localhost:4005/api/v1/inventory/${(data as any).inventoryItemId}`);
        if (itemRes.ok) {
          const item = await itemRes.json();
          if (item.currentStock > 0) {
            await fetch(`http://localhost:4005/api/v1/inventory/${item.id}`, {
              method: "PATCH",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ currentStock: item.currentStock - 1 }),
            });
          }
        }
      } catch {
        // Non-critical: don't fail the visit if inventory deduction fails
      }
    }

    return response;
  }
}
