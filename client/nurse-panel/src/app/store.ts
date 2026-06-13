import { configureStore } from "@reduxjs/toolkit";
import authReducer from "@/shared/auth/authSlice";
import { authApi } from "@/shared/auth/authApi";
import { studentsApi } from "@/entities/student/api/studentsApi";
import { visitsApi } from "@/entities/visit/api/visitsApi";
import { appointmentsApi } from "@/entities/appointment/api/appointmentsApi";
import { remindersApi } from "@/entities/reminder/api/remindersApi";
import { inventoryApi } from "@/entities/inventory/api/inventoryApi";

export const store = configureStore({
  reducer: {
    auth: authReducer,
    [authApi.reducerPath]: authApi.reducer,
    [studentsApi.reducerPath]: studentsApi.reducer,
    [visitsApi.reducerPath]: visitsApi.reducer,
    [appointmentsApi.reducerPath]: appointmentsApi.reducer,
    [remindersApi.reducerPath]: remindersApi.reducer,
    [inventoryApi.reducerPath]: inventoryApi.reducer,
  },
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware()
      .concat(authApi.middleware)
      .concat(studentsApi.middleware)
      .concat(visitsApi.middleware)
      .concat(appointmentsApi.middleware)
      .concat(remindersApi.middleware)
      .concat(inventoryApi.middleware),
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;
