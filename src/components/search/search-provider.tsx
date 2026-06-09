"use client";

import { createContext, useContext, useEffect, useState, type ReactNode } from "react";
import { CommandPalette } from "./command-palette";

const SearchPaletteContext = createContext<(() => void) | null>(null);

export function useOpenSearchPalette() {
  const open = useContext(SearchPaletteContext);
  if (!open) throw new Error("useOpenSearchPalette must be used within SearchProvider");
  return open;
}

export function SearchProvider({ children }: { children: ReactNode }) {
  const [open, setOpen] = useState(false);

  useEffect(() => {
    function handleKeyDown(event: KeyboardEvent) {
      if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === "k") {
        event.preventDefault();
        setOpen((prev) => !prev);
      }
    }
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  return (
    <SearchPaletteContext.Provider value={() => setOpen(true)}>
      {children}
      <CommandPalette open={open} onOpenChange={setOpen} />
    </SearchPaletteContext.Provider>
  );
}
