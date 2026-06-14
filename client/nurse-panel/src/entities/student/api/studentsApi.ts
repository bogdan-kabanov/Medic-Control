import { createApi, fetchBaseQuery } from "@reduxjs/toolkit/query/react";
import type { Student, CreateStudent, UpdateStudent } from "@medcare/contracts";
import { API_URLS } from "@/shared/config/api";

interface StudentsQuery {
  search?: string;
  grade?: string;
  disease?: string;
  page?: number;
  pageSize?: number;
}

interface PaginatedResponse<T> {
  items: T[];
  meta: { total: number; page: number; pageSize: number; totalPages: number };
}

export const studentsApi = createApi({
  reducerPath: "studentsApi",
  baseQuery: fetchBaseQuery({
    baseUrl: API_URLS.students,
    prepareHeaders: (headers) => {
      const token = sessionStorage.getItem("accessToken");
      if (token) headers.set("Authorization", `Bearer ${token}`);
      return headers;
    },
  }),
  tagTypes: ["Students"],
  endpoints: (build) => ({
    getStudents: build.query<PaginatedResponse<Student>, StudentsQuery>({
      query: (params) => ({ url: "/students", params }),
      providesTags: ["Students"],
    }),
    getStudent: build.query<Student, string>({
      query: (id) => `/students/${id}`,
      providesTags: (_r, _e, id) => [{ type: "Students", id }],
    }),
    createStudent: build.mutation<Student, CreateStudent>({
      query: (body) => ({ url: "/students", method: "POST", body }),
      invalidatesTags: ["Students"],
    }),
    updateStudent: build.mutation<Student, { id: string; body: UpdateStudent }>({
      query: ({ id, body }) => ({ url: `/students/${id}`, method: "PATCH", body }),
      invalidatesTags: ["Students"],
    }),
    deleteStudent: build.mutation<void, string>({
      query: (id) => ({ url: `/students/${id}`, method: "DELETE" }),
      invalidatesTags: ["Students"],
    }),
  }),
});

export const {
  useGetStudentsQuery,
  useGetStudentQuery,
  useCreateStudentMutation,
  useUpdateStudentMutation,
  useDeleteStudentMutation,
} = studentsApi;
