"use client";

import { configureStore, createSlice, PayloadAction } from "@reduxjs/toolkit";

export interface AuthState {
  userId: string | null;
  name: string | null;
  email: string | null;
  role: "super_admin" | "admin" | null;
}

const initialAuthState: AuthState = {
  userId: null,
  name: null,
  email: null,
  role: null,
};

const authSlice = createSlice({
  name: "auth",
  initialState: initialAuthState,
  reducers: {
    setAuthState: (_state, action: PayloadAction<AuthState>) => action.payload,
    clearAuthState: () => initialAuthState,
  },
});

export const { setAuthState, clearAuthState } = authSlice.actions;

export const store = configureStore({
  reducer: {
    auth: authSlice.reducer,
  },
  devTools: process.env.NODE_ENV !== "production",
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;
