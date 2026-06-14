import { createApi, fetchBaseQuery } from "@reduxjs/toolkit/query/react";
import type { RootState } from "@/app/store";
import { API_URLS } from "@/shared/config/api";

export interface Appointment {
  id: string;
  studentId: string;
  studentName: string;
  doctorType: string;
  reason: string;
  dateTime: string;
  priority: "Emergency" | "High" | "Medium" | "Low";
  status: "Pending" | "Approved" | "Completed" | "Cancelled";
  createdAt: string;
}

export const studentAppointmentsApi = createApi({
  reducerPath: "studentAppointmentsApi",
  baseQuery: fetchBaseQuery({
    baseUrl: API_URLS.appointments,
    prepareHeaders: (headers, { getState }) => {
      const state = getState() as RootState;
      if (state.auth.accessToken) {
        headers.set("Authorization", `Bearer ${state.auth.accessToken}`);
      }
      if (state.auth.user?.studentId) {
        headers.set("x-student-id", state.auth.user.studentId);
      }
      return headers;
    },
  }),
  tagTypes: ["MyAppointments"],
  endpoints: (build) => ({
    getMyAppointments: build.query<Appointment[], void>({
      query: () => "/appointments/my",
      providesTags: ["MyAppointments"],
    }),
  }),
});

export const { useGetMyAppointmentsQuery } = studentAppointmentsApi;
