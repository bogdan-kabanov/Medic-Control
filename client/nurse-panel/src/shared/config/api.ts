export const API_URLS = {
  auth: import.meta.env.VITE_API_AUTH || "http://localhost:4001/api/v1",
  students: import.meta.env.VITE_API_STUDENTS || "http://localhost:4002/api/v1",
  visits: import.meta.env.VITE_API_VISITS || "http://localhost:4003/api/v1",
  appointments: import.meta.env.VITE_API_APPOINTMENTS || "http://localhost:4004/api/v1",
  medications: import.meta.env.VITE_API_MEDICATIONS || "http://localhost:4005/api/v1",
} as const;
