"use client";

import { Provider as ReduxProvider } from "react-redux";
import { QueryClientProvider } from "@tanstack/react-query";
import { useEffect } from "react";
import { store } from "@/lib/store/store";
import { getQueryClient } from "@/lib/query/queryClient";
import ThemeProvider from "./components/common/ThemeProvider";

export default function Providers({ children }: { children: React.ReactNode }) {
  const queryClient = getQueryClient();

  useEffect(() => {
    const tokenKey = "bbt_csrf";
    if (sessionStorage.getItem(tokenKey)) {
      return;
    }

    fetch("/backend/auth/csrf", { credentials: "include" })
      .then((response) => response.json())
      .then((payload) => {
        if (payload?.success && payload?.data?.csrfToken) {
          sessionStorage.setItem(tokenKey, payload.data.csrfToken);
        }
      })
      .catch(() => {
        // Ignore bootstrap errors.
      });
  }, []);

  return (
    <ReduxProvider store={store}>
      <QueryClientProvider client={queryClient}>
        <ThemeProvider>{children}</ThemeProvider>
      </QueryClientProvider>
    </ReduxProvider>
  );
}
