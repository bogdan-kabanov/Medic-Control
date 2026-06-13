import { createApi, fetchBaseQuery } from "@reduxjs/toolkit/query/react";

// В dev: напрямую к сервисам. В prod: через Kong Gateway.
const BASE_URLS = {
  auth: "http://localhost:4001/api/v1",
  students: "http://localhost:4002/api/v1",
  visits: "http://localhost:4003/api/v1",
  appointments: "http://localhost:4004/api/v1",
  medications: "http://localhost:4005/api/v1",
} as const;

export const baseApi = createApi({
  reducerPath: "api",
  baseQuery: fetchBaseQuery({
    baseUrl: BASE_URLS.students, // default, overridden per endpoint
    prepareHeaders: (headers) => {
      const token = sessionStorage.getItem("accessToken");
      if (token) {
        headers.set("Authorization", `Bearer ${token}`);
      }
      return headers;
    },
  }),
  tagTypes: ["Students", "Visits", "Appointments", "Reminders", "Inventory", "Notifications"],
  endpoints: () => ({}),
});

export { BASE_URLS };
