import { createSlice, type PayloadAction } from "@reduxjs/toolkit";

interface AuthState {
  accessToken: string | null;
  refreshToken: string | null;
  user: {
    userId: string;
    email: string;
    role: string;
    firstName: string;
    lastName: string;
  } | null;
}

const saved = sessionStorage.getItem("nurseAuth");
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
      sessionStorage.setItem("nurseAuth", JSON.stringify(state));
    },
    logout(state) {
      state.accessToken = null;
      state.refreshToken = null;
      state.user = null;
      sessionStorage.removeItem("nurseAuth");
    },
  },
});

export const { setCredentials, logout } = authSlice.actions;
export default authSlice.reducer;
export type { AuthState };
