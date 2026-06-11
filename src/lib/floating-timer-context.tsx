"use client";

import { createContext, useContext, useState, type ReactNode } from "react";

type FloatingTimerContextValue = {
  isOpen: boolean;
  open: () => void;
  close: () => void;
};

const FloatingTimerContext = createContext<FloatingTimerContextValue | null>(null);

export function FloatingTimerProvider({ children }: { children: ReactNode }) {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <FloatingTimerContext.Provider
      value={{ isOpen, open: () => setIsOpen(true), close: () => setIsOpen(false) }}
    >
      {children}
    </FloatingTimerContext.Provider>
  );
}

export function useFloatingTimer() {
  const ctx = useContext(FloatingTimerContext);
  if (!ctx) throw new Error("useFloatingTimer must be used inside FloatingTimerProvider");
  return ctx;
}
