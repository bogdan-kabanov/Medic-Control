import type { CreateStudent, UpdateStudent } from "@medcare/contracts";
import { ok, err, type Result } from "@medcare/contracts";
import type { StudentRepository, StudentEntity } from "../repositories/student.repository.js";

export interface StudentResponse {
  id: string;
  userId: string | null;
  firstName: string;
  lastName: string;
  grade: string;
  age: number;
  diseases: string[];
  medications: unknown;
  counselor: unknown;
  createdAt: string;
  updatedAt: string;
}

function mapToResponse(entity: StudentEntity): StudentResponse {
  return {
    id: entity.id,
    userId: entity.userId,
    firstName: entity.firstName,
    lastName: entity.lastName,
    grade: entity.grade,
    age: entity.age,
    diseases: entity.diseases,
    medications: entity.medications,
    counselor: entity.counselor,
    createdAt: entity.createdAt.toISOString(),
    updatedAt: entity.updatedAt.toISOString(),
  };
}

export class StudentService {
  constructor(private studentRepo: StudentRepository) {}

  async getStudents(filters: {
    search?: string | undefined;
    grade?: string | undefined;
    disease?: string | undefined;
    page: number;
    pageSize: number;
  }) {
    const { items, total } = await this.studentRepo.findAll(filters);
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

  async getStudent(id: string): Promise<Result<StudentResponse>> {
    const student = await this.studentRepo.findById(id);
    if (!student) {
      return err({ code: "NOT_FOUND", message: "Student not found", statusCode: 404 });
    }
    return ok(mapToResponse(student));
  }

  async getMyProfile(userId: string): Promise<Result<StudentResponse>> {
    const student = await this.studentRepo.findByUserId(userId);
    if (!student) {
      return err({ code: "NOT_FOUND", message: "Student not found", statusCode: 404 });
    }
    return ok(mapToResponse(student));
  }

  async createStudent(data: CreateStudent): Promise<StudentResponse> {
    const entity = await this.studentRepo.create({
      firstName: data.firstName,
      lastName: data.lastName,
      grade: data.grade,
      age: data.age,
      diseases: data.diseases,
      medications: data.medications,
      counselor: data.counselor,
    });
    return mapToResponse(entity);
  }

  async updateStudent(id: string, data: UpdateStudent): Promise<Result<StudentResponse>> {
    const existing = await this.studentRepo.findById(id);
    if (!existing) {
      return err({ code: "NOT_FOUND", message: "Student not found", statusCode: 404 });
    }

    const updateData: Partial<{
      firstName: string;
      lastName: string;
      grade: string;
      age: number;
      diseases: string[];
      medications: unknown;
      counselor: unknown;
    }> = {};

    if (data.firstName !== undefined) updateData.firstName = data.firstName;
    if (data.lastName !== undefined) updateData.lastName = data.lastName;
    if (data.grade !== undefined) updateData.grade = data.grade;
    if (data.age !== undefined) updateData.age = data.age;
    if (data.diseases !== undefined) updateData.diseases = data.diseases;
    if (data.medications !== undefined) updateData.medications = data.medications;
    if (data.counselor !== undefined) updateData.counselor = data.counselor;

    const entity = await this.studentRepo.update(id, updateData);
    return ok(mapToResponse(entity));
  }

  async deleteStudent(id: string): Promise<Result<void>> {
    const existing = await this.studentRepo.findById(id);
    if (!existing) {
      return err({ code: "NOT_FOUND", message: "Student not found", statusCode: 404 });
    }
    await this.studentRepo.softDelete(id);
    return ok(undefined as unknown as void);
  }

  async autocomplete(q: string) {
    return this.studentRepo.autocomplete(q);
  }
}
