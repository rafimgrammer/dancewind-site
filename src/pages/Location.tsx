// src/pages/Location.tsx
import { useEffect, useRef, useState } from "react";
import { PageHeader, Card } from "../components/Ui";
import { Skeleton } from "../components/Skeleton";
import { EditModeBanner, IconButton, ConfirmModal, type PendingConfirm } from "../components/InlineAdmin";
import { useAuth } from "../context/AuthContext";
import { useLocationContent } from "../context/LocationContentContext";

const KAKAO_KEY = import.meta.env.VITE_KAKAO_MAP_KEY;
const LAT = 37.88651;
const LNG = 127.74017;

function KakaoMap() {
  const mapRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const scriptId = "kakao-map-sdk";

    function initMap() {
      if (!mapRef.current) return;
      window.kakao.maps.load(() => {
        const map = new window.kakao.maps.Map(mapRef.current, {
          center: new window.kakao.maps.LatLng(LAT, LNG),
          level: 3,
        });

        const marker = new window.kakao.maps.Marker({
          position: new window.kakao.maps.LatLng(LAT, LNG),
        });
        marker.setMap(map);
      });
    }

    if (window.kakao && window.kakao.maps) {
      initMap();
      return;
    }

    let script = document.getElementById(scriptId) as HTMLScriptElement | null;
    if (!script) {
      script = document.createElement("script");
      script.id = scriptId;
      script.src = `https://dapi.kakao.com/v2/maps/sdk.js?appkey=${KAKAO_KEY}&autoload=false`;
      script.async = true;
      document.head.appendChild(script);
    }
    script.addEventListener("load", initMap);

    return () => {
      script?.removeEventListener("load", initMap);
    };
  }, []);

  return <div ref={mapRef} className="h-full w-full rounded-xl" />;
}

export default function Location() {
  const { role } = useAuth();
  const isPresident = role === "president";
  const { content, loading, editContent } = useLocationContent();

  const [editMode, setEditMode] = useState(false);
  const [pendingConfirm, setPendingConfirm] = useState<PendingConfirm | null>(null);
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState({ title: "", description: "" });

  const runConfirm = async () => {
    if (!pendingConfirm) return;
    await pendingConfirm.onConfirm();
    setPendingConfirm(null);
  };

  const startEdit = () => {
    if (!content) return;
    setDraft({ title: content.title, description: content.description });
    setEditing(true);
  };

  const save = () => {
    setPendingConfirm({
      title: "위치 안내 문구를 저장하시겠습니까?",
      desc: "바로 모든 방문자에게 반영돼요.",
      actionLabel: "저장할게요",
      onConfirm: async () => {
        await editContent(draft);
        setEditing(false);
      },
    });
  };

  return (
    <div>
      {isPresident && <EditModeBanner editMode={editMode} onToggle={() => setEditMode((v) => !v)} />}

      <PageHeader eyebrow="Location" title="동방 찾아오시는 길" desc="학생회관 지하, 거울과 스피커가 있는 그 방입니다." />
      <div className="grid min-w-0 gap-6 md:grid-cols-[1.2fr_0.8fr]">
        <Card className="aspect-[16/10] min-w-0 overflow-hidden p-0">
          <KakaoMap />
        </Card>
        <div className="min-w-0 space-y-4">
          <Card>
            {loading || !content ? (
              <div className="space-y-2">
                <Skeleton className="h-5 w-3/4" />
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-4 w-2/3" />
              </div>
            ) : editing ? (
              <div className="space-y-2.5">
                <input
                  value={draft.title}
                  onChange={(e) => setDraft({ ...draft, title: e.target.value })}
                  className="w-full rounded-lg border border-dawn-teal/50 bg-stage px-3 py-2 text-sm text-backstage outline-none"
                />
                <textarea
                  value={draft.description}
                  onChange={(e) => setDraft({ ...draft, description: e.target.value })}
                  rows={4}
                  className="w-full resize-none rounded-lg border border-dawn-teal/50 bg-stage px-3 py-2 text-sm text-backstage outline-none"
                />
                <div className="flex gap-2">
                  <button onClick={save} className="rounded-lg bg-wind-gold px-3 py-1.5 text-xs font-semibold text-stage">저장</button>
                  <button onClick={() => setEditing(false)} className="rounded-lg border border-line px-3 py-1.5 text-xs text-mute">취소</button>
                </div>
              </div>
            ) : (
              <>
                {editMode && isPresident && (
                  <div className="mb-3">
                    <IconButton onClick={startEdit} label="✎ 문구 수정" />
                  </div>
                )}
                <p className="font-display text-lg text-backstage">{content.title}</p>
                <p className="mt-2 text-sm leading-relaxed text-backstage/75">{content.description}</p>
              </>
            )}
          </Card>
        </div>
      </div>

      <ConfirmModal pending={pendingConfirm} onCancel={() => setPendingConfirm(null)} onConfirm={runConfirm} />
    </div>
  );
}