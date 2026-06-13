import { FastifyInstance } from "fastify";
import type { DashboardSummary } from "@medcare/contracts";

export function createDashboardRoutes() {
  return async function dashboardRoutes(app: FastifyInstance) {
    // GET /reports/dashboard
    app.get("/dashboard", async (): Promise<DashboardSummary> => {
      // Hardcoded for now — will be replaced with cross-service queries
      return {
        totalStudents: 42,
        medRemindersToday: 8,
        visitsToday: 5,
        emergencyAlerts: 1,
      };
    });
  };
}
