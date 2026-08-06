// src/context/LocationContentContext.tsx
import { createContext, useCallback, useContext, useEffect, useState, type ReactNode } from "react";
import { supabase } from "../lib/supabase";

export interface LocationContent {
  title: string;
  description: string;
}

interface LocationContentContextType {
  content: LocationContent | null;
  loading: boolean;
  editContent: (data: LocationContent) => Promise<void>;
}

const LocationContentContext = createContext<LocationContentContextType | null>(null);

export function LocationContentProvider({ children }: { children: ReactNode }) {
  const [content, setContent] = useState<LocationContent | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchAll = useCallback(async () => {
    setLoading(true);
    const { data } = await supabase.from("location_content").select("*").eq("id", 1).maybeSingle();
    setContent(data ? { title: data.title, description: data.description } : null);
    setLoading(false);
  }, []);

  useEffect(() => {
    fetchAll();
  }, [fetchAll]);

  const editContent = async (data: LocationContent) => {
    await supabase.from("location_content").update({ title: data.title, description: data.description }).eq("id", 1);
    await fetchAll();
  };

  return (
    <LocationContentContext.Provider value={{ content, loading, editContent }}>
      {children}
    </LocationContentContext.Provider>
  );
}

export function useLocationContent() {
  const ctx = useContext(LocationContentContext);
  if (!ctx) throw new Error("useLocationContent는 LocationContentProvider 안에서만 써야 해요.");
  return ctx;
}