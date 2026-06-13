import { ReferralCreatedEvent } from "@medcare/contracts";
import { consumeEvents } from "./rabbitmq.js";
import type { AppointmentService } from "./services/appointment.service.js";

export async function startConsumer(appointmentService: AppointmentService): Promise<void> {
  await consumeEvents(
    "appointments.referral",
    ["visit.referral.created"],
    async (msg) => {
      const event = ReferralCreatedEvent.parse(msg);

      await appointmentService.createFromReferral({
        studentId: event.studentId,
        studentName: event.studentName,
        reason: event.reason,
        complaintType: event.complaintType,
      });

      console.log(`Created appointment for student ${event.studentName} (referral from visit ${event.visitId})`);
    }
  );
}
