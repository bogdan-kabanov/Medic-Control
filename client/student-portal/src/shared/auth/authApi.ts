import { createApi, fetchBaseQuery } from "@reduxjs/toolkit/query/react";

interface LoginRequest {
  email: string;
  password: string;
}

interface LoginResponse {
  accessToken: string;
  refreshToken: string;
}

interface MeResponse {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  role: string;
  studentId: string | null;
  isActive: boolean;
  createdAt: string;
}

export const authApi = createApi({
  reducerPath: "authApi",
  baseQuery: fetchBaseQuery({
    baseUrl: "http://localhost:4001/api/v1/auth",
    prepareHeaders: (headers, { getState }) => {
      const state = getState() as { auth: { accessToken: string | null } };
      if (state.auth.accessToken) {
        headers.set("Authorization", `Bearer ${state.auth.accessToken}`);
      }
      return headers;
    },
  }),
  endpoints: (build) => ({
    login: build.mutation<LoginResponse, LoginRequest>({
      query: (body) => ({ url: "/login", method: "POST", body }),
    }),
    getMe: build.query<MeResponse, void>({
      query: () => "/me",
    }),
  }),
});

export const { useLoginMutation, useGetMeQuery } = authApi;
