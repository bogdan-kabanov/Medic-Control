import { createApi, fetchBaseQuery } from "@reduxjs/toolkit/query/react";
import { API_URLS } from "@/shared/config/api";

export interface Reminder {
  id: string;
  studentId: string;
  studentName: string;
  medication: string;
  dosage: string;
  dateTime: string;
  notes: string;
  status: "Pending" | "Done" | "Missed" | "EarlyIntake";
  confirmedAt: string | null;
  confirmedBy: string | null;
  courseId: string | null;
  courseName: string | null;
}

export interface CreateReminder {
  studentId: string;
  medication: string;
  dosage: string;
  dateTime: string;
  notes?: string;
}

interface RemindersQuery {
  status?: string;
}

export const remindersApi = createApi({
  reducerPath: "remindersApi",
  baseQuery: fetchBaseQuery({
    baseUrl: API_URLS.medications,
    prepareHeaders: (headers) => {
      const token = sessionStorage.getItem("accessToken");
      if (token) headers.set("Authorization", `Bearer ${token}`);
      return headers;
    },
  }),
  tagTypes: ["Reminders"],
  endpoints: (build) => ({
    getReminders: build.query<Reminder[], RemindersQuery>({
      query: (params) => ({ url: "/reminders", params }),
      transformResponse: (response: any) => {
        if (Array.isArray(response)) return response;
        return response.items ?? [];
      },
      providesTags: ["Reminders"],
    }),
    createReminder: build.mutation<Reminder, CreateReminder>({
      query: (body) => ({ url: "/reminders", method: "POST", body }),
      invalidatesTags: ["Reminders"],
    }),
    createCourse: build.mutation<{ courseId: string; count: number }, {
      studentId: string;
      medication: string;
      dosage: string;
      startDate: string;
      durationDays: number;
      times: string[];
      notes: string;
    }>({
      query: (body) => ({ url: "/reminders/course", method: "POST", body }),
      invalidatesTags: ["Reminders"],
    }),
    markReminderDone: build.mutation<Reminder, string>({
      query: (id) => ({
        url: `/reminders/${id}/done`,
        method: "PATCH",
        body: { confirmedBy: "nurse" },
      }),
      invalidatesTags: ["Reminders"],
    }),
  }),
});

export const {
  useGetRemindersQuery,
  useCreateReminderMutation,
  useCreateCourseMutation,
  useMarkReminderDoneMutation,
} = remindersApi;
