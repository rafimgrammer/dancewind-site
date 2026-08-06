// src/context/OfficersContext.tsx
import { createContext, useCallback, useContext, useEffect, useState, type ReactNode } from "react";
import { supabase } from "../lib/supabase";

export interface Officer {
  id: string;
  role: string;
  name: string;
  part: string;
  note: string;
  photoUrl: string | null;
  sortOrder: number;
}

export interface OfficerInput {
  role: string;
  name: string;
  part: string;
  note: string;
}

interface OfficersContextType {
  officers: Officer[];
  loading: boolean;
  addOfficer: (data: OfficerInput) => Promise<void>;
  editOfficer: (id: string, data: OfficerInput) => Promise<void>;
  removeOfficer: (id: string) => Promise<void>;
  // 사진 파일을 올리고, 성공하면 officers.photo_url까지 갱신해줘요.
  uploadPhoto: (id: string, file: File) => Promise<{ ok: boolean; message?: string }>;
}

const OfficersContext = createContext<OfficersContextType | null>(null);

export function OfficersProvider({ children }: { children: ReactNode }) {
  const [officers, setOfficers] = useState<Officer[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchAll = useCallback(async () => {
    setLoading(true);
    const { data } = await supabase.from("officers").select("*").order("sort_order", { ascending: true });
    setOfficers(
      (data ?? []).map((o) => ({
        id: o.id,
        role: o.role,
        name: o.name,
        part: o.part,
        note: o.note,
        photoUrl: o.photo_url,
        sortOrder: o.sort_order,
      }))
    );
    setLoading(false);
  }, []);

  useEffect(() => {
    fetchAll();
  }, [fetchAll]);

  const addOfficer = async (data: OfficerInput) => {
    if (!data.name.trim() || !data.role.trim()) return;
    await supabase.from("officers").insert({
      role: data.role.trim(),
      name: data.name.trim(),
      part: data.part.trim(),
      note: data.note.trim(),
      sort_order: officers.length,
    });
    await fetchAll();
  };

  const editOfficer = async (id: string, data: OfficerInput) => {
    if (!data.name.trim() || !data.role.trim()) return;
    await supabase
      .from("officers")
      .update({ role: data.role.trim(), name: data.name.trim(), part: data.part.trim(), note: data.note.trim() })
      .eq("id", id);
    await fetchAll();
  };

  const removeOfficer = async (id: string) => {
    await supabase.from("officers").delete().eq("id", id);
    await fetchAll();
  };

  const uploadPhoto = async (id: string, file: File): Promise<{ ok: boolean; message?: string }> => {
    if (!file.type.startsWith("image/")) {
      return { ok: false, message: "이미지 파일만 업로드할 수 있어요." };
    }
    if (file.size > 5 * 1024 * 1024) {
      return { ok: false, message: "5MB 이하의 이미지만 업로드할 수 있어요." };
    }

    const ext = file.name.split(".").pop() ?? "jpg";
    // 같은 경로로 덮어써도 브라우저/CDN 캐시에 옛날 사진이 남지 않도록 매번 새 파일명을 써요.
    const path = `${id}-${Date.now()}.${ext}`;

    const { error: uploadError } = await supabase.storage.from("officer-photos").upload(path, file, {
      cacheControl: "3600",
      upsert: false,
    });
    if (uploadError) {
      return { ok: false, message: "업로드에 실패했어요: " + uploadError.message };
    }

    const { data: publicUrlData } = supabase.storage.from("officer-photos").getPublicUrl(path);
    await supabase.from("officers").update({ photo_url: publicUrlData.publicUrl }).eq("id", id);
    await fetchAll();
    return { ok: true };
  };

  return (
    <OfficersContext.Provider value={{ officers, loading, addOfficer, editOfficer, removeOfficer, uploadPhoto }}>
      {children}
    </OfficersContext.Provider>
  );
}

export function useOfficers() {
  const ctx = useContext(OfficersContext);
  if (!ctx) throw new Error("useOfficers는 OfficersProvider 안에서만 써야 해요.");
  return ctx;
}