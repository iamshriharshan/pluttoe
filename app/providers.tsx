"use client";

import type { ReactNode } from "react";
import { Toaster } from "sonner";

import { ErrorBoundary } from "@/components/error-boundary";
import { AuthProvider } from "@/contexts/AuthContext";

export function Providers({ children }: { children: ReactNode }) {
  return (
    <ErrorBoundary>
      <AuthProvider>
        {children}
        <Toaster richColors position="top-right" />
      </AuthProvider>
    </ErrorBoundary>
  );
}
