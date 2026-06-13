import { createSlice, type PayloadAction } from "@reduxjs/toolkit";

interface AuthState {
  accessToken: string | null;
  refreshToken: string | null;
  user: {
    userId: string;
    email: string;
    role: string;
    studentId: string;
    firstName: string;
    lastName: string;
  } | null;
}

const saved = sessionStorage.getItem("auth");
const initial: AuthState = saved
  ? JSON.parse(saved)
  : { accessToken: null, refreshToken: null, user: null };

const authSlice = createSlice({
  name: "auth",
  initialState: initial,
  reducers: {
    setCredentials(state, action: PayloadAction<{
      accessToken: string;
      refreshToken: string;
      user: AuthState["user"];
    }>) {
      state.accessToken = action.payload.accessToken;
      state.refreshToken = action.payload.refreshToken;
      state.user = action.payload.user;
      sessionStorage.setItem("auth", JSON.stringify(state));
    },
    logout(state) {
      state.accessToken = null;
      state.refreshToken = null;
      state.user = null;
      sessionStorage.removeItem("auth");
    },
  },
});

export const { setCredentials, logout } = authSlice.actions;
export default authSlice.reducer;
export type { AuthState };
