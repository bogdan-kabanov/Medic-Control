import { configureStore } from "@reduxjs/toolkit";
import { authApi } from "@/shared/auth/authApi";
import authReducer from "@/shared/auth/authSlice";
import { studentRemindersApi } from "@/entities/reminder/api/remindersApi";
import { studentAppointmentsApi } from "@/entities/appointment/api/appointmentsApi";
import { studentVisitsApi } from "@/entities/visit/api/visitsApi";
import { profileApi } from "@/entities/profile/api/profileApi";

export const store = configureStore({
  reducer: {
    auth: authReducer,
    [authApi.reducerPath]: authApi.reducer,
    [studentRemindersApi.reducerPath]: studentRemindersApi.reducer,
    [studentAppointmentsApi.reducerPath]: studentAppointmentsApi.reducer,
    [studentVisitsApi.reducerPath]: studentVisitsApi.reducer,
    [profileApi.reducerPath]: profileApi.reducer,
  },
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware()
      .concat(authApi.middleware)
      .concat(studentRemindersApi.middleware)
      .concat(studentAppointmentsApi.middleware)
      .concat(studentVisitsApi.middleware)
      .concat(profileApi.middleware),
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;
