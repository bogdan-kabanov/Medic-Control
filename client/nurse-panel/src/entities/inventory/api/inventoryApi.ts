import { createApi, fetchBaseQuery } from "@reduxjs/toolkit/query/react";

export interface InventoryItem {
  id: string;
  name: string;
  unit: "Tablets" | "Puffs" | "ML" | "Pieces";
  currentStock: number;
  minThreshold: number;
  updatedAt: string;
}

export interface AddInventoryBody {
  name: string;
  unit: string;
  quantity: number;
  minThreshold: number;
}

export interface UpdateInventoryBody {
  currentStock?: number;
  minThreshold?: number;
}

interface InventoryQuery {
  search?: string;
}

export const inventoryApi = createApi({
  reducerPath: "inventoryApi",
  baseQuery: fetchBaseQuery({
    baseUrl: "http://localhost:4005/api/v1",
    prepareHeaders: (headers) => {
      const token = sessionStorage.getItem("accessToken");
      if (token) headers.set("Authorization", `Bearer ${token}`);
      return headers;
    },
  }),
  tagTypes: ["Inventory"],
  endpoints: (build) => ({
    getInventory: build.query<InventoryItem[], InventoryQuery>({
      query: (params) => ({ url: "/inventory", params }),
      transformResponse: (response: any) => {
        if (Array.isArray(response)) return response;
        return response.items ?? [];
      },
      providesTags: ["Inventory"],
    }),
    addInventoryItem: build.mutation<InventoryItem, AddInventoryBody>({
      query: (body) => ({ url: "/inventory", method: "POST", body }),
      invalidatesTags: ["Inventory"],
    }),
    updateInventoryItem: build.mutation<InventoryItem, { id: string; body: UpdateInventoryBody }>({
      query: ({ id, body }) => ({ url: `/inventory/${id}`, method: "PATCH", body }),
      invalidatesTags: ["Inventory"],
    }),
  }),
});

export const {
  useGetInventoryQuery,
  useAddInventoryItemMutation,
  useUpdateInventoryItemMutation,
} = inventoryApi;
