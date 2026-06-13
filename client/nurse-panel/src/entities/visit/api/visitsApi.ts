import { createApi, fetchBaseQuery } from "@reduxjs/toolkit/query/react";

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

export interface CreateVisit {
  firstName: string;
  lastName: string;
  grade: string;
  arrivalTime: string;
  complaint: string;
  complaintType: string;
  treatmentGiven: string;
  scheduleDoctorAppointment: boolean;
}

interface VisitsQuery {
  date?: string;
  search?: string;
}

interface PaginatedVisits {
  items: Visit[];
  meta: { total: number; page: number; pageSize: number; totalPages: number };
}

export const visitsApi = createApi({
  reducerPath: "visitsApi",
  baseQuery: fetchBaseQuery({
    baseUrl: "http://localhost:4003/api/v1",
    prepareHeaders: (headers) => {
      const token = sessionStorage.getItem("accessToken");
      if (token) headers.set("Authorization", `Bearer ${token}`);
      return headers;
    },
  }),
  tagTypes: ["Visits"],
  endpoints: (build) => ({
    getVisits: build.query<Visit[], VisitsQuery>({
      query: (params) => ({ url: "/visits", params }),
      transformResponse: (response: PaginatedVisits | Visit[]) => {
        if (Array.isArray(response)) return response;
        return response.items ?? [];
      },
      providesTags: ["Visits"],
    }),
    createVisit: build.mutation<Visit, CreateVisit>({
      query: (body) => ({ url: "/visits", method: "POST", body }),
      invalidatesTags: ["Visits"],
    }),
  }),
});

export const { useGetVisitsQuery, useCreateVisitMutation } = visitsApi;
