import type { DashboardSummary } from "@medcare/contracts";

/**
 * Dashboard service — currently returns hardcoded data.
 * In production, this would query other service DBs or use materialized views.
 */
export class DashboardService {
  async getSummary(): Promise<DashboardSummary> {
    return {
      totalStudents: 42,
      medRemindersToday: 8,
      visitsToday: 5,
      emergencyAlerts: 1,
    };
  }
}
