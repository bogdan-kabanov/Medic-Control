import { createApi, fetchBaseQuery } from "@reduxjs/toolkit/query/react";
import type { RootState } from "@/app/store";

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
}

export const studentRemindersApi = createApi({
  reducerPath: "studentRemindersApi",
  baseQuery: fetchBaseQuery({
    baseUrl: "http://localhost:4005/api/v1",
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
  tagTypes: ["MyReminders"],
  endpoints: (build) => ({
    getMyReminders: build.query<Reminder[], void>({
      query: () => "/reminders/my",
      providesTags: ["MyReminders"],
    }),
    confirmReminder: build.mutation<Reminder, string>({
      query: (id) => ({
        url: `/reminders/${id}/confirm`,
        method: "PATCH",
        body: { confirmedBy: "student" },
      }),
      invalidatesTags: ["MyReminders"],
    }),
  }),
});

export const { useGetMyRemindersQuery, useConfirmReminderMutation } = studentRemindersApi;
