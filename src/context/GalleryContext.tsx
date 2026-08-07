// src/context/GalleryContext.tsx
import { createContext, useCallback, useContext, useEffect, useState, type ReactNode } from "react";
import { supabase } from "../lib/supabase";

export interface GalleryPhoto {
  id: string;
  albumId: string;
  photoUrl: string;
  sortOrder: number;
}

export interface GalleryAlbum {
  id: string;
  title: string;
  eventDate: string;
  category: string;
  coverPhotoUrl: string | null;
  photos: GalleryPhoto[];
}

interface GalleryContextType {
  albums: GalleryAlbum[];
  loading: boolean;
  getAlbumById: (id: string) => GalleryAlbum | undefined;
  addAlbum: (title: string, eventDate: string, category: string) => Promise<string | null>;
  editAlbum: (id: string, title: string, eventDate: string, category: string) => Promise<void>;
  removeAlbum: (id: string) => Promise<void>;
  uploadPhotos: (albumId: string, files: File[]) => Promise<{ ok: boolean; message?: string }>;
  removePhoto: (photoId: string) => Promise<void>;
  setCoverPhoto: (albumId: string, photoUrl: string) => Promise<void>;
}

const GalleryContext = createContext<GalleryContextType | null>(null);

const MAX_FILE_MB = 8;
const MAX_DIMENSION = 2000; // 이보다 긴 변을 이 픽셀 수에 맞춰 줄여요
const JPEG_QUALITY = 0.82;

// 업로드 전에 브라우저에서 이미지를 리사이즈 + 재압축해요.
// 폰카메라 원본(15~20MB대)도 대부분 1~2MB 이하로 줄어들어서, 8MB 제한에 걸릴 일이 거의 없어져요.
async function compressImage(file: File): Promise<File> {
  try {
    const bitmap = await createImageBitmap(file);
    const scale = Math.min(1, MAX_DIMENSION / Math.max(bitmap.width, bitmap.height));
    const width = Math.round(bitmap.width * scale);
    const height = Math.round(bitmap.height * scale);

    const canvas = document.createElement("canvas");
    canvas.width = width;
    canvas.height = height;
    const ctx = canvas.getContext("2d");
    if (!ctx) return file;
    ctx.drawImage(bitmap, 0, 0, width, height);
    bitmap.close();

    const blob: Blob | null = await new Promise((resolve) =>
      canvas.toBlob((b) => resolve(b), "image/jpeg", JPEG_QUALITY)
    );
    if (!blob) return file;

    // 압축한 결과가 오히려 더 크면(원래 작은 사진이었던 경우) 그냥 원본을 써요.
    if (blob.size >= file.size) return file;

    const newName = file.name.replace(/\.[^.]+$/, "") + ".jpg";
    return new File([blob], newName, { type: "image/jpeg" });
  } catch {
    // HEIC 등 브라우저가 디코딩 못 하는 형식이면 압축 없이 원본으로 시도해요.
    return file;
  }
}

export function GalleryProvider({ children }: { children: ReactNode }) {
  const [albums, setAlbums] = useState<GalleryAlbum[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchAll = useCallback(async () => {
    setLoading(true);
    const [{ data: albumData }, { data: photoData }] = await Promise.all([
      supabase.from("gallery_albums").select("*").order("event_date", { ascending: false }),
      supabase.from("gallery_photos").select("*").order("sort_order", { ascending: true }),
    ]);

    const photosByAlbum: Record<string, GalleryPhoto[]> = {};
    (photoData ?? []).forEach((p) => {
      if (!photosByAlbum[p.album_id]) photosByAlbum[p.album_id] = [];
      photosByAlbum[p.album_id].push({
        id: p.id,
        albumId: p.album_id,
        photoUrl: p.photo_url,
        sortOrder: p.sort_order,
      });
    });

    setAlbums(
      (albumData ?? []).map((a) => ({
        id: a.id,
        title: a.title,
        eventDate: a.event_date,
        category: a.category,
        coverPhotoUrl: a.cover_photo_url,
        photos: photosByAlbum[a.id] ?? [],
      }))
    );
    setLoading(false);
  }, []);

  useEffect(() => {
    fetchAll();
  }, [fetchAll]);

  const getAlbumById = (id: string) => albums.find((a) => a.id === id);

  const addAlbum = async (title: string, eventDate: string, category: string): Promise<string | null> => {
    if (!title.trim() || !eventDate) return null;
    const { data, error } = await supabase
      .from("gallery_albums")
      .insert({ title: title.trim(), event_date: eventDate, category })
      .select("id")
      .single();
    await fetchAll();
    if (error || !data) return null;
    return data.id;
  };

  const editAlbum = async (id: string, title: string, eventDate: string, category: string) => {
    if (!title.trim() || !eventDate) return;
    await supabase
      .from("gallery_albums")
      .update({ title: title.trim(), event_date: eventDate, category })
      .eq("id", id);
    await fetchAll();
  };

  const removeAlbum = async (id: string) => {
    await supabase.from("gallery_albums").delete().eq("id", id);
    await fetchAll();
  };

  const uploadPhotos = async (albumId: string, files: File[]): Promise<{ ok: boolean; message?: string }> => {
    const album = albums.find((a) => a.id === albumId);
    let nextOrder = album ? album.photos.length : 0;
    const uploadedUrls: string[] = [];
    const skipped: string[] = [];

    for (const rawFile of files) {
      if (!rawFile.type.startsWith("image/")) {
        skipped.push(`${rawFile.name} (이미지 파일 아님)`);
        continue;
      }

      const file = await compressImage(rawFile);

      if (file.size > MAX_FILE_MB * 1024 * 1024) {
        skipped.push(`${file.name} (압축 후에도 ${MAX_FILE_MB}MB 초과)`);
        continue;
      }

      const ext = file.name.split(".").pop() ?? "jpg";
      const path = `${albumId}/${Date.now()}-${nextOrder}.${ext}`;

      const { error: uploadError } = await supabase.storage.from("gallery-photos").upload(path, file, {
        cacheControl: "3600",
        upsert: false,
      });
      if (uploadError) {
        skipped.push(`${file.name} (업로드 실패: ${uploadError.message})`);
        continue;
      }

      const { data: publicUrlData } = supabase.storage.from("gallery-photos").getPublicUrl(path);
      uploadedUrls.push(publicUrlData.publicUrl);
      nextOrder += 1;
    }

    if (uploadedUrls.length > 0) {
      await supabase.from("gallery_photos").insert(
        uploadedUrls.map((url, i) => ({
          album_id: albumId,
          photo_url: url,
          sort_order: (album ? album.photos.length : 0) + i,
        }))
      );

      // 앨범에 커버 사진이 아직 없으면 첫 업로드 사진을 커버로 지정해줘요.
      if (album && !album.coverPhotoUrl) {
        await supabase.from("gallery_albums").update({ cover_photo_url: uploadedUrls[0] }).eq("id", albumId);
      }
      await fetchAll();
    }

    if (uploadedUrls.length === 0) {
      return { ok: false, message: "업로드할 수 있는 사진이 없었어요.\n" + skipped.join("\n") };
    }
    if (skipped.length > 0) {
      return {
        ok: true,
        message: `${uploadedUrls.length}장 업로드 완료, ${skipped.length}장은 제외됐어요.\n` + skipped.join("\n"),
      };
    }
    return { ok: true };
  };

  const removePhoto = async (photoId: string) => {
    await supabase.from("gallery_photos").delete().eq("id", photoId);
    await fetchAll();
  };

  const setCoverPhoto = async (albumId: string, photoUrl: string) => {
    await supabase.from("gallery_albums").update({ cover_photo_url: photoUrl }).eq("id", albumId);
    await fetchAll();
  };

  return (
    <GalleryContext.Provider
      value={{ albums, loading, getAlbumById, addAlbum, editAlbum, removeAlbum, uploadPhotos, removePhoto, setCoverPhoto }}
    >
      {children}
    </GalleryContext.Provider>
  );
}

export function useGallery() {
  const ctx = useContext(GalleryContext);
  if (!ctx) throw new Error("useGallery는 GalleryProvider 안에서만 써야 해요.");
  return ctx;
}