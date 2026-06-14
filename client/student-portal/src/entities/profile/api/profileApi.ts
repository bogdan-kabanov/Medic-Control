import { createApi, fetchBaseQuery } from "@reduxjs/toolkit/query/react";
import type { RootState } from "@/app/store";
import { API_URLS } from "@/shared/config/api";

export interface StudentProfile {
  id: string;
  firstName: string;
  lastName: string;
  grade: string;
  age: number;
  diseases: string[];
  medications: { name: string; dosage: string }[];
  counselor: {
    name: string;
    phone: string;
  };
}

export const profileApi = createApi({
  reducerPath: "profileApi",
  baseQuery: fetchBaseQuery({
    baseUrl: API_URLS.students,
    prepareHeaders: (headers, { getState }) => {
      const state = getState() as RootState;
      if (state.auth.accessToken) {
        headers.set("Authorization", `Bearer ${state.auth.accessToken}`);
      }
      if (state.auth.user?.userId) {
        headers.set("x-user-id", state.auth.user.userId);
      }
      return headers;
    },
  }),
  tagTypes: ["Profile"],
  endpoints: (build) => ({
    getMyProfile: build.query<StudentProfile, void>({
      query: () => "/students/me",
      providesTags: ["Profile"],
    }),
  }),
});

export const { useGetMyProfileQuery } = profileApi;
