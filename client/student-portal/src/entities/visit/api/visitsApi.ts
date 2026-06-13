import { createApi, fetchBaseQuery } from "@reduxjs/toolkit/query/react";
import type { RootState } from "@/app/store";

export interface Visit {
  id: string;
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

export const studentVisitsApi = createApi({
  reducerPath: "studentVisitsApi",
  baseQuery: fetchBaseQuery({
    baseUrl: "http://localhost:4003/api/v1",
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
  tagTypes: ["MyVisits"],
  endpoints: (build) => ({
    getMyVisits: build.query<Visit[], void>({
      query: () => "/visits/my",
      providesTags: ["MyVisits"],
    }),
  }),
});

export const { useGetMyVisitsQuery } = studentVisitsApi;
