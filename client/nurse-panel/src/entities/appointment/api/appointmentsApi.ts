import { createApi, fetchBaseQuery } from "@reduxjs/toolkit/query/react";
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

export interface CreateAppointment {
  studentId: string;
  doctorType: string;
  reason: string;
  dateTime: string;
  priority: "Emergency" | "High" | "Medium" | "Low";
}

interface AppointmentsQuery {
  status?: string;
}

export const appointmentsApi = createApi({
  reducerPath: "appointmentsApi",
  baseQuery: fetchBaseQuery({
    baseUrl: API_URLS.appointments,
    prepareHeaders: (headers) => {
      const token = sessionStorage.getItem("accessToken");
      if (token) headers.set("Authorization", `Bearer ${token}`);
      return headers;
    },
  }),
  tagTypes: ["Appointments"],
  endpoints: (build) => ({
    getAppointments: build.query<Appointment[], AppointmentsQuery>({
      query: (params) => ({ url: "/appointments", params }),
      transformResponse: (response: any) => {
        if (Array.isArray(response)) return response;
        return response.items ?? [];
      },
      providesTags: ["Appointments"],
    }),
    createAppointment: build.mutation<Appointment, CreateAppointment>({
      query: (body) => ({ url: "/appointments", method: "POST", body }),
      invalidatesTags: ["Appointments"],
    }),
    approveAppointment: build.mutation<Appointment, string>({
      query: (id) => ({ url: `/appointments/${id}/approve`, method: "PATCH" }),
      invalidatesTags: ["Appointments"],
    }),
    cancelAppointment: build.mutation<Appointment, string>({
      query: (id) => ({ url: `/appointments/${id}/cancel`, method: "PATCH" }),
      invalidatesTags: ["Appointments"],
    }),
    completeAppointment: build.mutation<Appointment, string>({
      query: (id) => ({ url: `/appointments/${id}/complete`, method: "PATCH" }),
      invalidatesTags: ["Appointments"],
    }),
  }),
});

export const {
  useGetAppointmentsQuery,
  useCreateAppointmentMutation,
  useApproveAppointmentMutation,
  useCancelAppointmentMutation,
  useCompleteAppointmentMutation,
} = appointmentsApi;
